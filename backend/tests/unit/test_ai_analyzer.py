import unittest
from unittest.mock import Mock
from botocore.exceptions import ClientError
from pydantic import ValidationError

from app.domain.models import Signal
from app.domain.enums import SignalSourceType
from app.ai.analyzer import BedrockAdapter

class TestAIAnalyzer(unittest.TestCase):
    def setUp(self):
        self.mock_bedrock_client = Mock()
        self.test_signal = Signal(
            id="sig-123",
            source_type=SignalSourceType.text,
            content="There is a large pothole on Main St. It looks dangerous."
        )

    def create_mock_response(self, tool_input):
        return {
            'output': {
                'message': {
                    'content': [
                        {
                            'toolUse': {
                                'name': 'SubmitAIAnalysis',
                                'input': tool_input
                            }
                        }
                    ]
                }
            }
        }

    def get_valid_tool_input(self):
        return {
            "classification": {
                "category": "infrastructure",
                "eventType": "pothole",
                "object": "road"
            },
            "understanding": {
                "summary": "A large pothole was reported on Main St.",
                "observedFacts": ["Large pothole", "Located on Main St."]
            },
            "assessment": {
                "severity": "medium",
                "confidence": 0.9,
                "riskFactors": ["Vehicle damage", "Accident risk"]
            },
            "guidance": {
                "recommendedAction": "Dispatch road maintenance crew.",
                "mode": "seek_assistance"
            },
            "uncertainty": {
                "missingInformation": ["Exact address or cross street"],
                "needsClarification": True
            }
        }

    def test_analyze_signal_valid_response(self):
        self.mock_bedrock_client.converse.return_value = self.create_mock_response(self.get_valid_tool_input())
        
        adapter = BedrockAdapter(bedrock_client=self.mock_bedrock_client)
        result = adapter.analyze_signal(self.test_signal)
        
        self.assertEqual(result.classification.category, "infrastructure")
        self.assertEqual(result.assessment.severity, "medium")
        self.assertEqual(result.guidance.mode, "seek_assistance")
        self.assertEqual(result.metadata.modelId, "amazon.nova-lite-v1:0")

    def test_analyze_signal_invalid_enum(self):
        invalid_input = self.get_valid_tool_input()
        invalid_input["assessment"]["severity"] = "super-high"
        
        self.mock_bedrock_client.converse.side_effect = [
            self.create_mock_response(invalid_input),
            self.create_mock_response(self.get_valid_tool_input())
        ]
        
        adapter = BedrockAdapter(bedrock_client=self.mock_bedrock_client)
        result = adapter.analyze_signal(self.test_signal)
        
        self.assertEqual(self.mock_bedrock_client.converse.call_count, 2)
        self.assertEqual(result.assessment.severity, "medium")

    def test_analyze_signal_missing_field(self):
        invalid_input = self.get_valid_tool_input()
        del invalid_input["guidance"]
        
        self.mock_bedrock_client.converse.side_effect = [
            self.create_mock_response(invalid_input),
            self.create_mock_response(self.get_valid_tool_input())
        ]
        
        adapter = BedrockAdapter(bedrock_client=self.mock_bedrock_client)
        result = adapter.analyze_signal(self.test_signal)
        
        self.assertEqual(self.mock_bedrock_client.converse.call_count, 2)
        self.assertEqual(result.guidance.recommendedAction, "Dispatch road maintenance crew.")

    def test_analyze_signal_malformed_json_simulation(self):
        invalid_response = {
            'output': {
                'message': {
                    'content': [
                        {'text': 'Here is the analysis: ...'}
                    ]
                }
            }
        }
        
        self.mock_bedrock_client.converse.side_effect = [
            invalid_response,
            self.create_mock_response(self.get_valid_tool_input())
        ]
        
        adapter = BedrockAdapter(bedrock_client=self.mock_bedrock_client)
        result = adapter.analyze_signal(self.test_signal)
        
        self.assertEqual(self.mock_bedrock_client.converse.call_count, 2)
        self.assertEqual(result.assessment.confidence, 0.9)

    def test_analyze_signal_retry_exhausted(self):
        invalid_input = self.get_valid_tool_input()
        invalid_input["classification"]["category"] = "invalid_category"
        
        self.mock_bedrock_client.converse.side_effect = [
            self.create_mock_response(invalid_input),
            self.create_mock_response(invalid_input)
        ]
        
        adapter = BedrockAdapter(bedrock_client=self.mock_bedrock_client)
        with self.assertRaises(ValidationError):
            adapter.analyze_signal(self.test_signal)
            
        self.assertEqual(self.mock_bedrock_client.converse.call_count, 2)

    def test_analyze_signal_bedrock_exception(self):
        error_response = {'Error': {'Code': 'ThrottlingException', 'Message': 'Rate exceeded'}}
        client_error = ClientError(error_response, 'Converse')
        
        self.mock_bedrock_client.converse.side_effect = [
            client_error,
            self.create_mock_response(self.get_valid_tool_input())
        ]
        
        adapter = BedrockAdapter(bedrock_client=self.mock_bedrock_client)
        result = adapter.analyze_signal(self.test_signal)
        
        self.assertEqual(self.mock_bedrock_client.converse.call_count, 2)
        self.assertEqual(result.classification.category, "infrastructure")

if __name__ == '__main__':
    unittest.main()
