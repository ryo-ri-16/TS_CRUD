export type User = {
  id: number;
  name: string;
  age: number | null;
  gender: "MALE" | "FEMALE" | "OTHER";
  description: string | null;
  createdAt: string;
  updatedAt: string;
};
