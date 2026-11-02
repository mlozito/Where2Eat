// True if a database error means "that value must be unique, and it isn't".
export function isUniqueViolation(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const e = error as { code?: unknown; name?: unknown; message?: unknown };
  return (
    e.code === "23505" || // Postgres's official code for unique violations
    e.name === "Prisma.UniqueViolationError" ||
    (typeof e.message === "string" && /unique|duplicate/i.test(e.message))
  );
}