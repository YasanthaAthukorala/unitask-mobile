export const themePreferences = ['system', 'light', 'dark'];
export async function readThemePreference(db) {
  const result = await db.getFirstAsync("SELECT value FROM metadata WHERE key='theme-preference'");
  return themePreferences.includes(result?.value) ? result.value : 'system';
}
export async function writeThemePreference(db, value) {
  if (!themePreferences.includes(value)) throw new Error('Invalid appearance preference');
  await db.runAsync("INSERT INTO metadata (key,value) VALUES ('theme-preference',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value", [value]);
}
