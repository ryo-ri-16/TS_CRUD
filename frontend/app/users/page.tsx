import Link from "next/link";
import type { User } from "@/types/user";

export default async function UsersPage() {
  const response = await fetch("http://localhost:3001/users");
  const users: User[] = await response.json();

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

      {users.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
          <p className="text-gray-600">ユーザーがまだ登録されていません</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {users.map((user) => (
            <Link
              key={user.id}
              href={`/users/${user.id}`}
              className="block bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow"
            >
              <h2 className="text-lg font-semibold mb-2">{user.name}</h2>
              <div className="text-sm text-gray-600 space-y-1">
                <p>年齢: {user.age ?? "未設定"}</p>
                <p>
                  性別:
                  {user.gender === "MALE" && " 男性"}
                  {user.gender === "FEMALE" && " 女性"}
                  {user.gender === "OTHER" && " その他"}
                </p>
                {user.description && (
                  <p className="line-clamp-2">{user.description}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
