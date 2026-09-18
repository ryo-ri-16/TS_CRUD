import { z } from "zod";

// Prisma の enum Gender（backend/prisma/schema.prisma）と値を一致させる必要がある。
// Prisma Client の生成物（backend/src/generated/prisma）はbackend専用でfrontendから参照できないため、
// このリストは今後もPrismaスキーマと手動で同期を取る必要がある。
export const GENDER_VALUES = [
  "MALE",
  "FEMALE",
  "OTHER",
  "PREFER_NOT_TO_SAY",
] as const;

export type Gender = (typeof GENDER_VALUES)[number];

export const userSchema = z.object({
  name: z.string().min(1, "名前を入力してください"),

  // age/description はPrismaスキーマ上 `Int?` / `String?`（任意項目）なので nullable にしている。
  // 以前のfrontend側スキーマ（frontend/app/validations/user-schemas.ts）は
  // nullable() が付いておらずbackend側と定義がずれていたが、
  // 共有化にあたりPrismaスキーマに正しく対応するbackend側の定義に統一した。
  age: z
    .number()
    .int("年齢は整数で入力してください")
    .min(0, "年齢は0以上で入力してください")
    .max(150, "年齢が不正です")
    .nullable(),

  gender: z.enum(GENDER_VALUES),

  description: z
    .string()
    .max(500, "説明は500文字以内で入力してください")
    .nullable(),
});

export type UserInput = z.infer<typeof userSchema>;
