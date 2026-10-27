// Loaded via vitest `setupFiles` before any application module is imported.
// Forces NODE_ENV=test so env validation and dev-only branches behave
// deterministically inside the suite.
process.env.NODE_ENV = "test";
