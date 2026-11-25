interface ClinicSubscriptionInput {
  isActive: boolean;
  planExpiresAt: Date | string | null;
}

export type ClinicAccessStatus = "ACTIVE" | "EXPIRED" | "SUSPENDED";

export function getClinicAccessStatus(
  clinic: ClinicSubscriptionInput,
  now = new Date(),
): ClinicAccessStatus {
  if (!clinic.isActive) return "SUSPENDED";

  if (clinic.planExpiresAt) {
    const expiresAt =
      clinic.planExpiresAt instanceof Date
        ? clinic.planExpiresAt
        : new Date(clinic.planExpiresAt);

    if (!Number.isNaN(expiresAt.getTime()) && expiresAt < now) {
      return "EXPIRED";
    }
  }

  return "ACTIVE";
}
