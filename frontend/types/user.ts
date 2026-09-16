export type User = {
  id: number;
  name: string;
  email: string;
  age: number | null;
  gender: "MALE" | "FEMALE" | "OTHER" | "PREFER_NOT_TO_SAY";
  description: string | null;
  createdAt: string;
  updatedAt: string;
};

export type UserListResponse = {
  users: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};
