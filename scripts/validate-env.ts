/**
 * Environment configuration validator (run via `npm run config:validate`).
 *
 * Fails with a non-zero exit code when required configuration is missing or
 * when production settings use known insecure defaults. Prints problem keys
 * and reasons only — never secret values.
 */
import { validateServerEnv } from "../src/lib/configuration/env";

const problems = validateServerEnv(process.env);

if (problems.length > 0) {
  console.error("Environment configuration invalid:");
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}

console.log("Environment configuration OK (values not printed).");
