import { inspect } from 'node:util';

// Detect a Postgres unique violation across any error wrapping (Effect's
// FiberFailure → SqlError → PostgresError). We rely on `util.inspect` with
// deep recursion because Effect's FiberFailure surfaces the underlying cause
// only through its inspector view, not via plain enumerable properties.
export function isUniqueViolation(error: unknown): boolean {
  const text = inspect(error, { depth: 8, getters: true });
  return /23505|unique constraint|duplicate key/i.test(text);
}

// Returns the violated constraint/index name, or null if not a unique violation.
export function getUniqueConstraintName(error: unknown): string | null {
  if (!isUniqueViolation(error)) return null;
  const text = inspect(error, { depth: 8, getters: true });
  const match = text.match(/constraint["\s]+([a-z0-9_]+)/i)
    ?? text.match(/unique["\s]+constraint["\s"]+([a-z0-9_]+)/i)
    ?? text.match(/index["\s"]+([a-z0-9_]+)/i);
  return match?.[1] ?? null;
}
