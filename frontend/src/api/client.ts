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
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://5v3nc29f39.execute-api.us-east-1.amazonaws.com/v1/api/v1';
  
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
    if (
      !data.id ||
      !data.status ||
      !data.analysis ||
      !data.analysis.understanding ||
      !data.analysis.assessment ||
      !data.analysis.guidance ||
      !data.decision ||
      typeof data.decision.path !== 'string' ||
      typeof data.decision.requiresHumanReview !== 'boolean'
    ) {
      throw new Error("Server returned an unexpected incident response.");
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

