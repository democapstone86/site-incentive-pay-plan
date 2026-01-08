export function computeIncentivePayPlanStatus(payload) {
  const { effectiveStartDate, effectiveEndDate, isArchived } = payload || {};

  if (isArchived) return "ARCHIVED";

  if (!effectiveStartDate) return "PENDING";

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const start = new Date(effectiveStartDate);
  start.setHours(0, 0, 0, 0);

  if (start > today) return "PENDING";

  if (effectiveEndDate) {
    const end = new Date(effectiveEndDate);
    end.setHours(0, 0, 0, 0);
    if (end < today) return "NOT_IN_USE";
  }

  return "IN_USE";
}
