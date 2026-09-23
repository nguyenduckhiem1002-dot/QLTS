export function isDemoMode() {
  const configuredMode = process.env.QLTS_DEMO_MODE?.trim().toLowerCase();

  if (configuredMode === "true") return true;
  if (configuredMode === "false") return false;

  // Vercel Preview stays read-only by default so PRs never mutate the
  // production database. Production uses the real DB whenever available.
  if (process.env.VERCEL_ENV === "preview") return true;

  return !process.env.DATABASE_URL;
}

export function hasDatabaseUrl() {
  return Boolean(process.env.DATABASE_URL);
}
