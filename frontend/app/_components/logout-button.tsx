"use client";

import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/auth/logout`,
      {
        method: "POST",
        credentials: "include",
      }
    );

    if (response.ok) {
      router.push("/login");
      router.refresh();
    }
  };

  return (
    <button onClick={handleLogout}>
      ログアウト
    </button>
  );
}
