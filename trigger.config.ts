import { defineConfig } from "@trigger.dev/sdk";

export default defineConfig({
  project: "proj_pdhjqbcksjgxqmzoxejf",
  dirs: ["./trigger"],
  maxDuration: 300,
  build: {
    // Our data/AI layers import "server-only"; this condition resolves it
    // to its no-op build so tasks can run outside the Next.js runtime.
    conditions: ["react-server"],
  },
  retries: {
    enabledInDev: true,
    default: {
      maxAttempts: 3,
      factor: 2,
      minTimeoutInMs: 1000,
      maxTimeoutInMs: 30_000,
    },
  },
});
