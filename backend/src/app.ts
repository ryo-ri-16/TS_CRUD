import { Hono } from "hono";
import users from "./routes/users";
import auth from "./routes/auth";
import { cors } from "hono/cors";

// Honoアプリの組み立てだけを行うモジュール。
// サーバーの起動（serve()の呼び出し）は index.ts 側の責務にすることで、
// テストコードは実際にポートを開かずにこの app を直接テストできる
// （Honoの app.request() は fetch を模したリクエストをアプリに直接渡す仕組みで、
//  ネットワーク越しの通信を一切行わない）。
const app = new Hono();

app.use(
  "*",
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);
app.route("/auth", auth);
app.route("/users", users);

export default app;
