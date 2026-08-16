import type { User } from "@/types/user";
import Link from "next/link";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function UserDetailPage({ params }: Props) {
  const { id } = await params;

  const response = await fetch(
    `http://localhost:3001/users/${id}`
  );

  if (!response.ok) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">ユーザーが見つかりません</p>
        </div>
      </div>
    );
  }

  const user: User = await response.json();

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-4">
        <Link
          href="/users"
          className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
        >
          ← ユーザー一覧に戻る
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-4">{user.name}</h1>
        <dl className="space-y-3">
          <div>
            <dt className="text-sm font-semibold text-gray-600">年齢</dt>
            <dd className="text-lg">{user.age ?? "未設定"}</dd>
          </div>

          <div>
            <dt className="text-sm font-semibold text-gray-600">性別</dt>
            <dd className="text-lg">
              {user.gender === "MALE" && "男性"}
              {user.gender === "FEMALE" && "女性"}
              {user.gender === "OTHER" && "その他"}
            </dd>
          </div>

          <div>
            <dt className="text-sm font-semibold text-gray-600">説明</dt>
            <dd className="text-lg">{user.description ?? "未設定"}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}