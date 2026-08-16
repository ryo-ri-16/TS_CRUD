"use client";

import { useEffect, useState } from "react";

type User = {
  id: number;
  name: string;
  age: number | null;
  gender: string | null;
  description: string | null;
};

export default function UserList() {
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    fetch("http://localhost:3001/users")
      .then((res) => res.json())
      .then((data) => setUsers(data));
  }, []);

  return (
    <div>
      <h1>ユーザー一覧</h1>

      <ul>
        {users.map((user) => (
          <li key={user.id}>
            {user.name} ({user.age}歳) - {user.description}
          </li>
        ))}
      </ul>
    </div>
  );
}
