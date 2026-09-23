export function isDemoMode() {
  const configuredMode = process.env.QLTS_DEMO_MODE?.trim().toLowerCase();

  if (configuredMode === "true") return true;
  if (configuredMode === "false") return false;

  // Use the real database whenever DATABASE_URL is available, including Vercel.
  // Demo mode is now only a fallback for environments without a database.
  return !process.env.DATABASE_URL;
}

export function hasDatabaseUrl() {
  return Boolean(process.env.DATABASE_URL);
}
