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
      `${process.env.NEXT_PUBLIC_API_URL}/users/${userId}`,
      {
        method: "DELETE",
	credentials: "include",
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
