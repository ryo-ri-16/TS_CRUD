import Link from "next/link";
import UserForm from "../_components/user-form";

export default function NewUserPage() {
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
        <h1 className="text-2xl font-bold mb-6">ユーザー新規作成</h1>
        <UserForm />
      </div>
    </div>
  );
}