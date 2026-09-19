import type { Gender } from "@ts-crud/shared-schemas";

export type User = {
  id: number;
  name: string;
  email: string;
  age: number | null;
  gender: Gender;
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
