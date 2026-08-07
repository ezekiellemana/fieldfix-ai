export interface AgentEvidence {
  episodeId: string;
  similarity?: number;
  summary: string;
  outcome?: string;
}

export interface AgentRecommendation {
  likelyCauses: Array<{
    cause: string;
    confidence: number;
  }>;
  recommendedActions: string[];
  evidence: AgentEvidence[];
  confidence: number;
  requiresHumanApproval: boolean;
}
