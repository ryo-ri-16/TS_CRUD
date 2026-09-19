import { describe, it, expect } from "vitest";
import app from "../app";

// Honoの app.request() は「HTTPサーバーを起動せずに、fetchのリクエストを
// アプリに直接渡して結果（Responseオブジェクト）を受け取る」ためのテスト用API。
// 実際にポート3001を開くわけではないので、他のテストや開発サーバーと衝突しない。
const register = (body: Record<string, unknown>) =>
  app.request("/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

const login = (body: Record<string, unknown>) =>
  app.request("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

describe("POST /auth/register", () => {
  it("新しいユーザーを登録できる", async () => {
    const res = await register({
      name: "テスト太郎",
      email: "taro@example.com",
      password: "password123",
    });

    expect(res.status).toBe(201);

    // Response.json() の戻り値は unknown 型なので、検証したい形を明示してキャストする
    const body = (await res.json()) as {
      name: string;
      email: string;
      passwordHash?: string;
    };
    expect(body).toMatchObject({
      name: "テスト太郎",
      email: "taro@example.com",
    });
    // passwordHash（ハッシュ化済みとはいえ）をレスポンスに含めてはいけない
    expect(body.passwordHash).toBeUndefined();
  });

  it("既に登録済みのメールアドレスでは409になる", async () => {
    await register({
      name: "テスト太郎",
      email: "taro@example.com",
      password: "password123",
    });

    const res = await register({
      name: "テスト次郎",
      email: "taro@example.com",
      password: "password123",
    });

    expect(res.status).toBe(409);
  });

  it("パスワードが8文字未満だと400になる", async () => {
    const res = await register({
      name: "テスト太郎",
      email: "taro@example.com",
      password: "short",
    });

    expect(res.status).toBe(400);
  });
});

describe("POST /auth/login → GET /auth/me", () => {
  it("正しい認証情報でログインでき、発行されたCookieで/auth/meが呼べる", async () => {
    await register({
      name: "テスト太郎",
      email: "taro@example.com",
      password: "password123",
    });

    const loginRes = await login({
      email: "taro@example.com",
      password: "password123",
    });
    expect(loginRes.status).toBe(200);

    // ログイン成功時、Set-Cookieヘッダーに `session_id=<値>; HttpOnly; ...` が入っている。
    // ブラウザではないので自動でCookieが保存されないため、次のリクエストへ手動で転送する。
    const setCookie = loginRes.headers.get("set-cookie");
    expect(setCookie).toBeTruthy();
    const sessionCookie = setCookie!.split(";")[0]; // "session_id=xxxx" の部分だけ取り出す

    const meRes = await app.request("/auth/me", {
      headers: { Cookie: sessionCookie },
    });

    expect(meRes.status).toBe(200);
    const me = (await meRes.json()) as { email: string };
    expect(me.email).toBe("taro@example.com");
  });

  it("パスワードが間違っていると401になる", async () => {
    await register({
      name: "テスト太郎",
      email: "taro@example.com",
      password: "password123",
    });

    const res = await login({
      email: "taro@example.com",
      password: "wrong-password",
    });

    expect(res.status).toBe(401);
  });

  it("Cookieなしで/auth/meを呼ぶと401になる", async () => {
    const res = await app.request("/auth/me");
    expect(res.status).toBe(401);
  });
});
