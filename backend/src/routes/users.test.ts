import { describe, it, expect } from "vitest";
import app from "../app";
import { prisma } from "../lib/prisma";
import { registerAndLogin, withCookie } from "../test/helpers";

type ListResponse = {
  users: { id: number; name: string; email: string }[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
};

// 一覧系のテスト用に、認証・パスワードハッシュ化を通さず直接DBへ行を入れる（速いので大量に作れる）
const seedUsers = (names: string[]) =>
  prisma.user.createMany({
    data: names.map((name, i) => ({
      name,
      email: `${name.toLowerCase()}@example.com`,
      passwordHash: "dummy",
      createdAt: new Date(2026, 0, i + 1),
    })),
  });

const getList = async (cookie: string, query = "") => {
  const res = await app.request(`/users${query}`, withCookie(cookie));
  return { res, body: (await res.json()) as ListResponse };
};

describe("認証", () => {
  it("Cookieがないと 401（authMiddlewareが全ルートに効いている）", async () => {
    expect((await app.request("/users")).status).toBe(401);
    expect((await app.request("/users/1")).status).toBe(401);
    expect(
      (await app.request("/users/1", { method: "DELETE" })).status
    ).toBe(401);
  });

  it("不正なsession_idだと 401", async () => {
    const res = await app.request("/users", withCookie("session_id=invalid"));
    expect(res.status).toBe(401);
  });
});

describe("GET /users（検索・ソート・ページネーション）", () => {
  it("ページネーション情報つきで返す", async () => {
    const { cookie } = await registerAndLogin("Me", "me@example.com");
    await seedUsers(["Alice", "Bob", "Charlie"]);

    const { res, body } = await getList(cookie);

    expect(res.status).toBe(200);
    expect(body.users).toHaveLength(4); // 自分 + 3人
    expect(body.pagination).toEqual({ page: 1, limit: 10, total: 4, totalPages: 1 });
  });

  it("limit と page で分割して取得できる", async () => {
    const { cookie } = await registerAndLogin("Me", "me@example.com");
    await seedUsers(["Alice", "Bob", "Charlie", "David"]); // 合計5人

    const page1 = await getList(cookie, "?limit=2&page=1&sortBy=name&sortOrder=asc");
    const page3 = await getList(cookie, "?limit=2&page=3&sortBy=name&sortOrder=asc");

    expect(page1.body.users.map((u) => u.name)).toEqual(["Alice", "Bob"]);
    expect(page1.body.pagination.totalPages).toBe(3);
    // 最終ページは端数の1件だけ
    expect(page3.body.users.map((u) => u.name)).toEqual(["Me"]);
  });

  it("name / email の部分一致で検索でき、大文字小文字は区別しない", async () => {
    const { cookie } = await registerAndLogin("Me", "me@example.com");
    await seedUsers(["Alice", "Bob"]);

    const byName = await getList(cookie, "?search=ALI");
    const byEmail = await getList(cookie, "?search=bob@example");
    const none = await getList(cookie, "?search=zzz");

    expect(byName.body.users.map((u) => u.name)).toEqual(["Alice"]);
    expect(byEmail.body.users.map((u) => u.name)).toEqual(["Bob"]);
    expect(none.body.users).toEqual([]);
    // 検索結果の件数が total に反映される（全件数ではない）
    expect(byName.body.pagination.total).toBe(1);
  });

  it("sortBy / sortOrder で並び替えられる", async () => {
    const { cookie } = await registerAndLogin("Zed", "zed@example.com");
    await seedUsers(["Alice", "Bob"]);

    const asc = await getList(cookie, "?sortBy=name&sortOrder=asc");
    const desc = await getList(cookie, "?sortBy=name&sortOrder=desc");

    expect(asc.body.users.map((u) => u.name)).toEqual(["Alice", "Bob", "Zed"]);
    expect(desc.body.users.map((u) => u.name)).toEqual(["Zed", "Bob", "Alice"]);
  });

  it("許可されていない sortBy や不正な page/limit は 400", async () => {
    const { cookie } = await registerAndLogin("Me", "me@example.com");

    // passwordHash などでの並び替えを許すと情報が漏れるので、enumで弾かれる必要がある
    expect((await getList(cookie, "?sortBy=passwordHash")).res.status).toBe(400);
    expect((await getList(cookie, "?page=0")).res.status).toBe(400);
    expect((await getList(cookie, "?limit=101")).res.status).toBe(400);
    expect((await getList(cookie, "?page=abc")).res.status).toBe(400);
  });

  it("レスポンスに passwordHash を含めない", async () => {
    const { cookie } = await registerAndLogin("Me", "me@example.com");

    const { body } = await getList(cookie);

    expect(body.users[0]).not.toHaveProperty("passwordHash");
  });
});

describe("GET /users/:id", () => {
  it("ユーザーを取得できる（passwordHash は含まない）", async () => {
    const { id, cookie } = await registerAndLogin("Me", "me@example.com");

    const res = await app.request(`/users/${id}`, withCookie(cookie));

    expect(res.status).toBe(200);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body).toMatchObject({ id, name: "Me", email: "me@example.com" });
    expect(body).not.toHaveProperty("passwordHash");
  });

  it("他人のユーザー情報も閲覧できる（仕様）", async () => {
    const { cookie } = await registerAndLogin("Me", "me@example.com");
    const other = await registerAndLogin("Other", "other@example.com");

    const res = await app.request(`/users/${other.id}`, withCookie(cookie));

    expect(res.status).toBe(200);
  });

  it("存在しないIDは 404", async () => {
    const { cookie } = await registerAndLogin("Me", "me@example.com");

    const res = await app.request("/users/999999", withCookie(cookie));

    expect(res.status).toBe(404);
  });
});

describe("PATCH /users/:id", () => {
  const validBody = {
    name: "Updated",
    age: 30,
    gender: "OTHER",
    description: "更新しました",
  };

  const patch = (id: number, cookie: string, body: unknown) =>
    app.request(`/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify(body),
    });

  it("自分自身を更新でき、DBにも反映される", async () => {
    const { id, cookie } = await registerAndLogin("Me", "me@example.com");

    const res = await patch(id, cookie, validBody);

    expect(res.status).toBe(200);
    const saved = await prisma.user.findUnique({ where: { id } });
    expect(saved).toMatchObject({ name: "Updated", age: 30, gender: "OTHER" });
  });

  it("age / description は null を許容する", async () => {
    const { id, cookie } = await registerAndLogin("Me", "me@example.com");

    const res = await patch(id, cookie, { ...validBody, age: null, description: null });

    expect(res.status).toBe(200);
  });

  it("他人のユーザーは更新できず 403、データも変わらない", async () => {
    const { cookie } = await registerAndLogin("Me", "me@example.com");
    const other = await registerAndLogin("Other", "other@example.com");

    const res = await patch(other.id, cookie, validBody);

    expect(res.status).toBe(403);
    const unchanged = await prisma.user.findUnique({ where: { id: other.id } });
    expect(unchanged?.name).toBe("Other");
  });

  it("存在しないIDは 404", async () => {
    const { cookie } = await registerAndLogin("Me", "me@example.com");

    expect((await patch(999999, cookie, validBody)).status).toBe(404);
  });

  it("バリデーションエラーは 400", async () => {
    const { id, cookie } = await registerAndLogin("Me", "me@example.com");

    expect((await patch(id, cookie, { ...validBody, name: "" })).status).toBe(400);
    expect((await patch(id, cookie, { ...validBody, age: -1 })).status).toBe(400);
    expect((await patch(id, cookie, { ...validBody, gender: "UNKNOWN" })).status).toBe(400);
  });

  // 既知の不具合: PATCH は prisma.user.update の結果をそのまま返すため passwordHash が漏れる。
  // it.fails は「このテストが失敗する間は成功扱い」になる。修正してテストが通るようになると
  // 逆にエラーになるので、その時点で it.fails を it に戻す。
  it.fails("レスポンスに passwordHash を含めない", async () => {
    const { id, cookie } = await registerAndLogin("Me", "me@example.com");

    const res = await patch(id, cookie, validBody);

    expect(await res.json()).not.toHaveProperty("passwordHash");
  });
});

describe("DELETE /users/:id", () => {
  const del = (id: number, cookie: string) =>
    app.request(`/users/${id}`, { method: "DELETE", headers: { Cookie: cookie } });

  it("自分自身を削除でき、セッションもカスケード削除される", async () => {
    const { id, cookie } = await registerAndLogin("Me", "me@example.com");
    expect(await prisma.session.count({ where: { userId: id } })).toBe(1);

    const res = await del(id, cookie);

    expect(res.status).toBe(200);
    expect(await prisma.user.findUnique({ where: { id } })).toBeNull();
    expect(await prisma.session.count({ where: { userId: id } })).toBe(0);
  });

  it("他人のユーザーは削除できず 403", async () => {
    const { cookie } = await registerAndLogin("Me", "me@example.com");
    const other = await registerAndLogin("Other", "other@example.com");

    const res = await del(other.id, cookie);

    expect(res.status).toBe(403);
    expect(await prisma.user.findUnique({ where: { id: other.id } })).not.toBeNull();
  });

  it("存在しないIDは 404", async () => {
    const { cookie } = await registerAndLogin("Me", "me@example.com");

    expect((await del(999999, cookie)).status).toBe(404);
  });
});
