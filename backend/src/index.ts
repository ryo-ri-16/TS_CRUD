import { serve } from "@hono/node-server";
import app from "./app";

// wrangler.jsonc の main はこのファイルを指しており、Cloudflare Workers向けには
// この default export（fetchハンドラを持つHonoアプリ）が使われる。
export default app;

serve({
  fetch: app.fetch,
  port: 3001,
})

console.log('Server running on http://localhost:3001')
