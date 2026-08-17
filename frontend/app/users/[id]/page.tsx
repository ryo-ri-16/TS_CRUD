import type { User } from "@/types/user";
import Link from "next/link";
import { notFound } from "next/navigation";
import DeleteButton from "../_components/delete-button";

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
    notFound();
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
            <dd className="text-lg whitespace-pre-wrap">
              {user.description ?? "未設定"}
            </dd>
          </div>
        </dl>

        <div className="mt-6 flex gap-3">
          <Link
            href={`/users/${user.id}/edit`}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            編集
          </Link>
          <div
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            <DeleteButton userId={user.id}/>
          </div>
        </div>
      </div>
    </div>
  );
}
