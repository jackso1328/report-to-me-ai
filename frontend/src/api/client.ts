export interface EvidenceMetadata {
  evidenceId: string;
  objectKey: string;
  contentType: string;
  size: number;
}

const baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://5v3nc29f39.execute-api.us-east-1.amazonaws.com/v1/api/v1';

export type SignalPayload = {
  source: {
    type: 'text' | 'audio' | 'video';
    content?: string;
  };
  location?: {
    latitude?: number;
    longitude?: number;
    description?: string;
  };
  metadata?: Record<string, any>;
  evidence?: EvidenceMetadata[];
};

export interface IncidentResponse {
  id: string;
  status: string;
  processingState?: string;
  category?: string;
  severity?: string;
  createdAt: string;
  recurrenceCount?: number;
  signals?: any[];
  analysis?: any;
  decision: {
    path: string;
    reasoning: string;
    requiresHumanReview: boolean;
  };
}

export const getIncidents = async (): Promise<IncidentResponse[]> => {
  const response = await fetch(`${baseUrl}/incidents`, {
    headers: { 'Accept': 'application/json' }
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || `HTTP error! status: ${response.status}`);
  }
  return response.json();
};

export const getIncidentById = async (incidentId: string): Promise<IncidentResponse> => {
  const response = await fetch(`${baseUrl}/incidents/${incidentId}`, {
    headers: { 'Accept': 'application/json' }
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || `HTTP error! status: ${response.status}`);
  }
  return response.json();
};

export const updateIncidentReview = async (incidentId: string, payload: { status: string; comments?: string }): Promise<IncidentResponse> => {
  const response = await fetch(`${baseUrl}/incidents/${incidentId}/review`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || `HTTP error! status: ${response.status}`);
  }
  return response.json();
};

export const submitSignal = async (payload: SignalPayload): Promise<IncidentResponse> => {
  const idempotencyKey = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(36);

  try {
    const response = await fetch(`${baseUrl}/signals`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': idempotencyKey
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      throw new Error(
        body?.error?.message ||
        `Request failed (${response.status})`
      );
    }

    const data = await response.json();

    // Validate minimum required fields
    if (!data.id || !data.status) {
      throw new Error("Server returned an unexpected incident response.");
    }
    
    // If it is already completed (sync) or previously completed, validate the rest
    if (data.status !== 'new' && data.processingState !== 'queued' && data.processingState !== 'pending') {
      if (
        !data.analysis ||
        !data.analysis.understanding ||
        !data.analysis.assessment ||
        !data.analysis.guidance ||
        !data.decision ||
        typeof data.decision.path !== 'string' ||
        typeof data.decision.requiresHumanReview !== 'boolean'
      ) {
        throw new Error("Server returned an incomplete finalized incident response.");
      }
    }

    return data as IncidentResponse;
  } catch (error: any) {
    // If it's already an error from our validation or response.ok block, rethrow it
    if (error.message) {
      throw error;
    }
    throw new Error('A network error occurred while sending the observation.');
  }
};

export const getPresignedUrl = async (file: File | Blob): Promise<{ uploadUrl: string, evidenceId: string, objectKey: string }> => {
  const response = await fetch(`${baseUrl}/evidence/presign`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contentType: file.type,
      size: file.size
    })
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error?.message || `Failed to get upload URL (${response.status})`);
  }

  return response.json();
};

export const uploadToS3 = async (url: string, file: File | Blob): Promise<void> => {
  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': file.type
    },
    body: file
  });

  if (!response.ok) {
    throw new Error(`Upload to S3 failed (${response.status})`);
  }
};
