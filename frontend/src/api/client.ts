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
  // Simulate network delay for the processing animation to show
  await new Promise(resolve => setTimeout(resolve, 2000));

  // The user explicitly requested not to send the values since AWS Bedrock is not connected yet,
  // and to display an error message instead.
  throw new Error('Observation not sent: AWS Bedrock is not connected. Please connect your AWS account to process observations.');
};

