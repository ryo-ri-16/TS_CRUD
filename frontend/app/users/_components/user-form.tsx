"use client";

import { useState } from "react";
import { userSchema } from "../../validations/user-schemas";
import type { UserFormData } from "../../validations/user-schemas";
import styles from "./post-form.module.css";
import { User } from "@/types/user";
import { useRouter } from "next/navigation";

type Props = {
  user?: User;
}

type Gender = UserFormData["gender"];

export default function UserForm({ user }: Props) {
  const router = useRouter();

  const [name, setName] = useState(user?.name ?? "");
  const [gender, setGender] = useState<Gender>(
    user?.gender ?? "MALE"
  );
  const [age, setAge] = useState(user?.age?.toString() ?? "");
  const [description, setDescription] = useState(user?.description ?? "");
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const isEdit = !!user;

    const data: UserFormData = {
      name,
      age: Number(age),
      gender: gender as UserFormData["gender"],
      description,
    };

    const result = userSchema.safeParse(data);

    if (!result.success) {
      setErrors(result.error.flatten().fieldErrors);
      return;
    }

    setErrors({});

    const response = await fetch(
      isEdit
        ? `http://localhost:3001/users/${user.id}`
        : "http://localhost:3001/users",
      {
        method: isEdit ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(result.data),
      }
    );

    if (response.ok) {
      alert(isEdit ? "ユーザー更新成功" : "ユーザー作成成功!");

      if (isEdit) {
        router.push(`/users/${user.id}`);
      } else {
        setName("");
        setAge("");
        setDescription("");
        setGender("MALE");
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.formGroup}>
        <label className={styles.label}>名前</label>
        <input
          type="text"
          placeholder="山田太郎"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={styles.input}
          required
        />
        {errors.name && (
          <p className={styles.error}>{errors.name[0]}</p>
        )}
      </div>

      <div className={styles.formGroup}>
        <label className={styles.label}>性別</label>
        <select
          value={gender}
          onChange={(e) =>
            setGender(e.target.value as Gender)
          }
          className={styles.select}
        >
          <option value="MALE">男性</option>
          <option value="FEMALE">女性</option>
          <option value="OTHER">その他</option>
          <option value="PREFER_NOT_TO_SAY">回答しない</option>
        </select>
      </div>

      <div className={styles.formGroup}>
        <label className={styles.label}>年齢</label>
        <input
          type="number"
          placeholder="年齢"
          value={age}
          onChange={(e) => setAge(e.target.value)}
          className={styles.input}
        />
        {errors.age && (
          <p className={styles.error}>{errors.age[0]}</p>
        )}
      </div>

      <div className={styles.formGroup}>
        <label className={styles.label}>説明</label>
        <textarea
          placeholder="自己紹介を入力してください"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className={styles.textarea}
        />
        {errors.description && (
          <p className={styles.error}>{errors.description[0]}</p>
        )}
      </div>

      <button type="submit" className={styles.button}>
        {"作成"}
      </button>
    </form>
  );
}