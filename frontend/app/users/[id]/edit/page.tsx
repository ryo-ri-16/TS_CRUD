import { notFound } from 'next/navigation';
import UserForm from '../../_components/user-form';
import Link from 'next/link';
import type { User } from "@/types/user";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditUserPage({ params }: Props) {
  const { id } = await params;

  const response = await fetch(
    `http://localhost:3001/users/${id}`
  );

  if (!response.ok) {
    notFound();
  }

  const user = await response.json();

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-4">
        <Link
          href={`/users/${id}`}
          className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
        >
          ← 詳細ページに戻る
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-6">ユーザー編集</h1>
        <UserForm user={user} />
      </div>
    </div>
  );
}