export const ROLES = {
  FARMER: "farmer",
  VET: "vet",
  ADMIN: "admin",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const HEALTH_STATUS = {
  HEALTHY: "healthy",
  SICK: "sick",
} as const;

export type HealthStatus = (typeof HEALTH_STATUS)[keyof typeof HEALTH_STATUS];

export const SEVERITY = {
  MILD: "mild",
  MODERATE: "moderate",
  SEVERE: "severe",
} as const;

export type Severity = (typeof SEVERITY)[keyof typeof SEVERITY];

export const RECOVERY_STATUS = {
  SICK: "sick",
  RECOVERED: "recovered",
} as const;

export type RecoveryStatus =
  (typeof RECOVERY_STATUS)[keyof typeof RECOVERY_STATUS];

export const JOB_NAMES = {
  NOTIFY_FARMER: "notify-farmer",
  VET_MORNING_DIGEST: "vet-morning-digest",
} as const;
