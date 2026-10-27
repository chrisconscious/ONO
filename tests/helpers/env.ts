// Loaded via vitest `setupFiles` before any application module is imported.
// Forces NODE_ENV=test so env validation and dev-only branches behave
// deterministically inside the suite. Vitest already sets NODE_ENV=test, but
// we assert it here so a misconfigured run fails loudly instead of silently
// pointing at a non-test environment. (Direct assignment to process.env.NODE_ENV
// is rejected by TypeScript because its type declares it read-only.)
if (process.env.NODE_ENV !== "test") {
  throw new Error(
    `Test setup requires NODE_ENV=test but found "${process.env.NODE_ENV ?? "unset"}". Refusing to run tests against a non-test environment.`,
  );
}
