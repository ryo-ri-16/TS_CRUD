import app from "../app";

export const postJson = (path: string, body: unknown) =>
  app.request(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

// 認証が必要なルートをテストするために、実際の /auth/register → /auth/login を通して
// 「ログイン済みユーザー」を作る。テストにはブラウザがないのでCookieは自動保存されず、
// 返り値の cookie を各リクエストの Cookie ヘッダーに手動で付けて使う。
export async function registerAndLogin(name: string, email: string) {
  const registerRes = await postJson("/auth/register", {
    name,
    email,
    password: "password123",
  });
  const { id } = (await registerRes.json()) as { id: number };

  const loginRes = await postJson("/auth/login", {
    email,
    password: "password123",
  });
  const cookie = loginRes.headers.get("set-cookie")!.split(";")[0];

  return { id, cookie };
}

export const withCookie = (cookie: string) => ({ headers: { Cookie: cookie } });
