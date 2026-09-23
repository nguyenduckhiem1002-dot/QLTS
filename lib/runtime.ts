export function isDemoMode() {
  const configuredMode = process.env.QLTS_DEMO_MODE?.trim().toLowerCase();

  if (configuredMode === "true") return true;
  if (configuredMode === "false") return false;

  // Vercel is used as a public UI preview. The self-hosted deployment keeps
  // using PostgreSQL unless demo mode is explicitly enabled.
  return process.env.VERCEL === "1" || !process.env.DATABASE_URL;
}

export function hasDatabaseUrl() {
  return Boolean(process.env.DATABASE_URL);
}
