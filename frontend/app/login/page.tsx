"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setError("");

    const response = await fetch("http://localhost:3001/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      setError(data.error ?? "ログインに失敗しました");
      return;
    }

    router.push("/users");
  };

  return (
    <main>
      <h1>ログイン</h1>

      <form onSubmit={handleSubmit}>
        <div>
          <label>
            メールアドレス
          </label>

          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div>
          <label>
            パスワード
          </label>

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {error && (
          <p>{error}</p>
        )}

        <button type="submit">
          ログイン
        </button>
      </form>

      <Link href="/register" className="text-blue-600">
        アカウントをお持ちでない方はこちら
      </Link>
    </main>
  );
}