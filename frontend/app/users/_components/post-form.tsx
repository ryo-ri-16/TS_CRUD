"use client";

import { useState } from "react";
import { userSchema } from "../../validations/user-schemas";
import type { UserFormData } from "../../validations/user-schemas";
import styles from "./post-form.module.css";

export default function PostForm() {
  const [name, setName] = useState("");
  const [gender, setGender] = useState("MALE");
  const [age, setAge] = useState("");
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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

    const response = await fetch("http://localhost:3001/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(result.data),
    });

    if (response.ok) {
      alert("ユーザー作成成功!");

      setName("");
      setAge("");
      setDescription("");
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
          onChange={(e) => setGender(e.target.value)}
          className={styles.select}
        >
          <option value="MALE">男性</option>
          <option value="FEMALE">女性</option>
          <option value="OTHER">その他</option>
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