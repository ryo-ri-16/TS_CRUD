export default function NotFound() {
  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h2 className="text-xl font-bold text-red-800 mb-2">
          ユーザーが見つかりません
        </h2>
        <p className="text-red-700">
          指定されたIDのユーザーは存在しません。
        </p>
      </div>
    </div>
  );
}
