"use client";

import { useRouter } from "next/navigation";

type Props = {
  userId: number;
};

export default function DeleteButton({ userId }: Props) {
  const router = useRouter();

  const handleDelete = async () => {
    const confirmed = window.confirm(
      "このユーザーを削除しますか?"
    );

    if (!confirmed) {
      return;
    }

    const response = await fetch(
      `http://localhost:3001/users/${userId}`,
      {
        method: "DELETE",
      }
    );

    if (response.ok) {
      alert("ユーザーを削除しました");
      router.push("/users");
    } else {
      alert("ユーザーの削除に失敗しました");
    }
  };

  return (
    <button type="button" onClick={handleDelete}>
      削除
    </button>
  )
}