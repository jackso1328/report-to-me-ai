import os
import logging
from typing import List, Dict, Any
from opensearchpy import OpenSearch, RequestsHttpConnection
from requests_aws4auth import AWS4Auth
import boto3

from app.domain.models import RelatedIncident, SearchMetadata

logger = logging.getLogger(__name__)

class MemoryService:
    def __init__(self):
        self.index_name = os.environ.get("OPENSEARCH_INDEX_NAME", "incident-memory-v1")
        self.endpoint = os.environ.get("OPENSEARCH_ENDPOINT", "")
        self.client = self._init_client()

    def _init_client(self):
        if not self.endpoint:
            return None
            
        try:
            region = os.environ.get('AWS_REGION', 'us-east-1')
            credentials = boto3.Session().get_credentials()
            if not credentials:
                return None
                
            awsauth = AWS4Auth(
                credentials.access_key,
                credentials.secret_key,
                region,
                'aoss',
                session_token=credentials.token
            )
            host = self.endpoint.replace("https://", "").replace("http://", "")
            
            return OpenSearch(
                hosts=[{'host': host, 'port': 443}],
                http_auth=awsauth,
                use_ssl=True,
                verify_certs=True,
                connection_class=RequestsHttpConnection,
                timeout=5 # Short timeout for graceful degradation
            )
        except Exception as e:
            logger.error(f"Failed to initialize OpenSearch client: {e}")
            return None

    def find_related_incidents(self, 
                               category: str, 
                               event_type: str, 
                               obj: str, 
                               location_description: str,
                               limit: int = 10) -> List[RelatedIncident]:
        
        if not self.client:
            logger.warning("MemoryService has no configured OpenSearch client. Returning empty context.")
            return []

        try:
            # Build a simple boolean query for BM25
            must_clauses = []
            should_clauses = []
            
            if category:
                must_clauses.append({"match": {"category": category}})
            
            if obj:
                should_clauses.append({"match": {"object": obj}})
                
            if event_type:
                should_clauses.append({"match": {"eventType": event_type}})
                
            query = {
                "size": limit,
                "query": {
                    "bool": {
                        "must": must_clauses,
                        "should": should_clauses,
                        "minimum_should_match": 0
                    }
                }
            }
            
            response = self.client.search(
                body=query,
                index=self.index_name
            )
            
            hits = response.get('hits', {}).get('hits', [])
            related = []
            
            for hit in hits:
                source = hit['_source']
                score = hit['_score']
                
                # Derive relationship description
                relationship = "similar_category"
                if source.get('object') == obj and obj:
                    relationship = "same_object"
                if source.get('eventType') == event_type and event_type:
                    relationship = f"{relationship}_same_event_type"
                    
                meta = SearchMetadata(
                    score=float(score) if score else 0.0,
                    relationship=relationship,
                    index=self.index_name
                )
                
                related.append(RelatedIncident(
                    incidentId=source.get('incidentId', 'unknown'),
                    summary=source.get('summary', ''),
                    status=source.get('status', 'unknown'),
                    createdAt=source.get('createdAt', ''),
                    resolution=source.get('resolution'),
                    searchMetadata=meta
                ))
                
            return related
            
        except Exception as e:
            logger.error(f"OpenSearch query failed: {e}. Gracefully degrading to empty context.")
            return []
