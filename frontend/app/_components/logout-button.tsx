"use client";

import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    const response = await fetch(
      "http://localhost:3001/auth/logout",
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
