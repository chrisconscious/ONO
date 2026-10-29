/**
 * Login return paths are accepted only when they are app-relative. Rejecting
 * protocol-relative and absolute URLs prevents an open redirect after sign-in.
 */
export function isSafeInternalPath(value: string | undefined): value is string {
  return Boolean(value && value.startsWith("/") && !value.startsWith("//"));
}
