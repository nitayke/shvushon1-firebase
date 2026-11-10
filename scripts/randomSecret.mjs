// Usage: node scripts/randomSecret.mjs [bytes]
// Prints a random hex string (default 32 bytes = 64 chars), e.g. for the CRON_SECRET env var.
import { randomBytes } from 'node:crypto';

const bytes = Number(process.argv[2]) || 32;
console.log(randomBytes(bytes).toString('hex'));
