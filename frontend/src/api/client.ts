const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export interface SignalPayload {
  source: {
    type: string;
    content: string;
  };
}

export interface IncidentResponse {
  id: string;
  status: string;
  category: string;
  severity: string;
  analysis: {
    understanding: {
      summary: string;
      observedFacts: string[];
    };
    assessment: {
      severity: string;
      confidence: number;
    };
    guidance: {
      recommendedAction: string;
      mode: string;
    };
  };
  decision: {
    path: string;
    reasoning: string;
    requiresHumanReview: boolean;
  };
}

export const submitSignal = async (payload: SignalPayload): Promise<IncidentResponse> => {
  if (!API_BASE_URL) {
    throw new Error('VITE_API_BASE_URL is not configured');
  }

  const response = await fetch(`${API_BASE_URL}/api/v1/signals`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // 'Idempotency-Key': crypto.randomUUID() // Optional for now
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error('Something went wrong while understanding this. Please try again.');
  }

  return response.json();
};
