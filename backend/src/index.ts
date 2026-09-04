import { Hono } from "hono";
import users from "./routes/users";
import auth from "./routes/auth";
import { serve } from "@hono/node-server";

const app = new Hono();

app.route("/auth", auth);
app.route("/users", users);

export default app;

serve({
  fetch: app.fetch,
  port: 3001,
})

console.log('Server running on http://localhost:3001')
