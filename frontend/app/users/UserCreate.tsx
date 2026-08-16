import { useState } from "react"

export const UserCreate = () => {
  const [name, setName] = useState("")
  const [gender, setGender] = useState("MALE")
  const [age, setAge] = useState("")
  const [description, setDescription] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const response = await fetch("http://localhost:3001/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, gender, age: Number(age), description }),
    })

    if (response.ok) {
      alert("ユーザー作成成功!")
      setName("")
      setAge("")
      setDescription("")
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="名前"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <select value={gender} onChange={(e) => setGender(e.target.value)}>
        <option value="MALE">男性</option>
        <option value="FEMALE">女性</option>
        <option value="OTHER">その他</option>
      </select>
      <input
        type="number"
        placeholder="年齢"
        value={age}
        onChange={(e) => setAge(e.target.value)}
      />
      <textarea
        placeholder="説明"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <button type="submit">作成</button>
    </form>
  )
}