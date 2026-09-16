import Link from "next/link";
import { cookies } from "next/headers";
import type { UserListResponse } from "@/types/user";

type SearchParams = {
  search?: string;
  page?: string;
  sortBy?: string;
  sortOrder?: string;
};

type Props = {
  // Next.js 15/16のApp Routerでは searchParams は Promise で渡される（awaitしてから使う）
  searchParams: Promise<SearchParams>;
};

const SORT_OPTIONS = [
  { sortBy: "createdAt", sortOrder: "desc", label: "登録が新しい順" },
  { sortBy: "createdAt", sortOrder: "asc", label: "登録が古い順" },
  { sortBy: "name", sortOrder: "asc", label: "名前(昇順)" },
  { sortBy: "name", sortOrder: "desc", label: "名前(降順)" },
] as const;

const GENDER_LABEL: Record<string, string> = {
  MALE: "男性",
  FEMALE: "女性",
  OTHER: "その他",
  PREFER_NOT_TO_SAY: "回答しない",
};

export default async function UsersPage({ searchParams }: Props) {
  const params = await searchParams;
  const search = params.search ?? "";
  const page = Number(params.page ?? "1") || 1;
  const sortBy = params.sortBy ?? "createdAt";
  const sortOrder = params.sortOrder ?? "desc";

  // サーバーコンポーネントからのfetchにはブラウザのCookieが自動で乗らないため、
  // next/headers の cookies() で自分でセッションCookieを読み取ってヘッダーに転送する
  // （他ページ [id]/page.tsx, [id]/edit/page.tsx と同じパターン）
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("session_id");
  const headers = {
    Cookie: sessionId ? `session_id=${sessionId.value}` : "",
  };

  const query = new URLSearchParams({
    page: String(page),
    sortBy,
    sortOrder,
  });
  if (search) query.set("search", search);

  const response = await fetch(
    `http://localhost:3001/users?${query.toString()}`,
    {
      headers,
      cache: "no-store",
    }
  );

  if (!response.ok) {
    return (
      <div className="max-w-md mx-auto p-6 text-center">
        <p className="mb-4">ログインしてください。</p>
        <Link href="/login" className="text-blue-600 hover:text-blue-800">
          ログインページへ
        </Link>
      </div>
    );
  }

  const { users, pagination }: UserListResponse = await response.json();

  // ページ番号だけ差し替えて、検索語・並び順は維持したままのリンク先を作るヘルパー
  const pageHref = (targetPage: number) => {
    const p = new URLSearchParams(query);
    p.set("page", String(targetPage));
    return `/users?${p.toString()}`;
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">ユーザー一覧</h1>
        <Link
          href="/users/new"
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          新規作成
        </Link>
      </div>

      {/*
        method="GET" のネイティブHTMLフォーム。
        "use client" にせず、あえてブラウザ標準のフォーム送信に任せているのがポイント。
        GETフォームを送信するとブラウザは `/users?search=...` のようにURLを書き換えて
        遷移してくれるので、サーバーコンポーネントである UsersPage が
        新しい searchParams で再実行される。JS（onSubmitハンドラ）を一切書かずに
        検索・並び替え・ページネーションを1つの仕組み（URLのクエリパラメータ）で統一できる。
      */}
      <form method="GET" className="flex gap-2 mb-4">
        {/* 検索を送信したときにソート条件を失わないよう、隠しフィールドで一緒に送る */}
        <input type="hidden" name="sortBy" value={sortBy} />
        <input type="hidden" name="sortOrder" value={sortOrder} />
        <input
          type="text"
          name="search"
          defaultValue={search}
          placeholder="名前・メールアドレスで検索"
          className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-800 text-sm"
        >
          検索
        </button>
        {search && (
          <Link
            href={`/users?sortBy=${sortBy}&sortOrder=${sortOrder}`}
            className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 text-sm"
          >
            クリア
          </Link>
        )}
      </form>

      <div className="flex flex-wrap gap-2 mb-6 text-sm">
        <span className="text-gray-500 self-center">並び替え:</span>
        {SORT_OPTIONS.map((opt) => {
          const isActive =
            opt.sortBy === sortBy && opt.sortOrder === sortOrder;
          const p = new URLSearchParams();
          if (search) p.set("search", search);
          p.set("sortBy", opt.sortBy);
          p.set("sortOrder", opt.sortOrder);

          return (
            <Link
              key={`${opt.sortBy}-${opt.sortOrder}`}
              href={`/users?${p.toString()}`}
              className={`px-3 py-1 rounded-full border ${
                isActive
                  ? "bg-blue-600 text-white border-blue-600"
                  : "border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
            >
              {opt.label}
            </Link>
          );
        })}
      </div>

      {users.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
          <p className="text-gray-600">
            {search
              ? "該当するユーザーが見つかりません"
              : "ユーザーがまだ登録されていません"}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {users.map((user) => (
            <Link
              key={user.id}
              href={`/users/${user.id}`}
              className="block bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow"
            >
              <h2 className="text-lg font-semibold mb-1">{user.name}</h2>
              <div className="text-sm text-gray-600 space-y-1">
                <p>{user.email}</p>
                <p>年齢: {user.age ?? "未設定"}</p>
                <p>性別: {GENDER_LABEL[user.gender] ?? "未設定"}</p>
                {user.description && (
                  <p className="line-clamp-2">{user.description}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      {pagination.totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-6 text-sm">
          {page > 1 ? (
            <Link
              href={pageHref(page - 1)}
              className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50"
            >
              前へ
            </Link>
          ) : (
            <span className="px-3 py-1 border border-gray-200 rounded text-gray-300">
              前へ
            </span>
          )}

          <span className="text-gray-600">
            {pagination.page} / {pagination.totalPages} ページ（全
            {pagination.total}件）
          </span>

          {page < pagination.totalPages ? (
            <Link
              href={pageHref(page + 1)}
              className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50"
            >
              次へ
            </Link>
          ) : (
            <span className="px-3 py-1 border border-gray-200 rounded text-gray-300">
              次へ
            </span>
          )}
        </div>
      )}
    </div>
  );
}
