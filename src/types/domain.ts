export type UserRole = "technician" | "supervisor";

export type IncidentStatus =
  | "open"
  | "diagnosing"
  | "awaiting_approval"
  | "repairing"
  | "monitoring"
  | "resolved"
  | "failed";

export type Severity = "low" | "medium" | "high" | "critical";
