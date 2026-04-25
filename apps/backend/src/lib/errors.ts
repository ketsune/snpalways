import { inspect } from 'node:util';

// Detect a Postgres unique violation across any error wrapping (Effect's
// FiberFailure → SqlError → PostgresError). We rely on `util.inspect` with
// deep recursion because Effect's FiberFailure surfaces the underlying cause
// only through its inspector view, not via plain enumerable properties.
export function isUniqueViolation(error: unknown): boolean {
  const text = inspect(error, { depth: 8, getters: true });
  return /23505|unique constraint|duplicate key/i.test(text);
}
