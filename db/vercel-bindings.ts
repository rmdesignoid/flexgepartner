// Server-only bridge for the D1 operations used by the calendar on Vercel.
// The Vite alias selects this module only for the Nitro build.
type QueryResult = {
  success: boolean;
  results: Record<string, unknown>[];
  meta: { changes?: number; [key: string]: unknown };
  error?: string;
};

export function createD1Binding(environment: NodeJS.ProcessEnv = process.env, request: typeof fetch = fetch) {
  const account = environment.CLOUDFLARE_ACCOUNT_ID;
  const database = environment.CLOUDFLARE_D1_DATABASE_ID;
  const token = environment.CLOUDFLARE_D1_API_TOKEN;
  if (!account || !database || !token) {
    throw new Error("Calendar database is not configured. Set CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_D1_DATABASE_ID and CLOUDFLARE_D1_API_TOKEN in Vercel.");
  }
  const endpoint = `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(account)}/d1/database/${encodeURIComponent(database)}/query`;
  function prepare(sql: string, params: unknown[] = []) {
    async function execute(): Promise<QueryResult> {
      const response = await request(endpoint, {
        method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ sql, params }), signal: AbortSignal.timeout(15000), cache: "no-store",
      });
      const payload = await response.json() as { success?: boolean; result?: QueryResult[]; errors?: { message?: string }[] };
      const result = payload.result?.[0];
      if (!response.ok || !payload.success || !result?.success) {
        // Preserve the existing schema compatibility fallback without exposing credentials or SQL.
        const message = result?.error ?? payload.errors?.[0]?.message ?? "";
        if (message.includes("no such column") && message.includes("class_plan_id")) throw new Error("no such column: class_plan_id");
        throw new Error("Calendar database request failed. Check the D1 credentials and database migrations.");
      }
      return result;
    }
    return { bind: (...values: unknown[]) => prepare(sql, values), all: execute, run: execute };
  }
  return { prepare };
}

// Lazy access lets the dashboard render even before database credentials are configured.
export const env = { get DB() { return createD1Binding(); } };
