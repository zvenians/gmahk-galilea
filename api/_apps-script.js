export function appsScriptApiUrl() {
  return (process.env.GALILEA_APPS_SCRIPT_API_URL_V19 || process.env.GALILEA_APPS_SCRIPT_API_URL || '').trim();
}
