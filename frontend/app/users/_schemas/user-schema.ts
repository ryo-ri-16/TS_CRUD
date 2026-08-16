import { z } from "zod";

const userSchema = z.object({
  name: z
    .string()
    .min(1, "名前を入力してください"),

  age: z
    .number()
    .int("年齢は整数で入力してください")
    .min(0, "年齢は0以上で入力してください")
    .max(150, "年齢が不正です"),

  gender: z.enum([
    "MALE",
    "FEMALE",
    "OTHER",
    "PREFER_NOT_TO_SAY",
  ]),

  description: z
    .string()
    .max(500, "説明は500文字以内で入力してください"),
});

export type UserFormData = z.infer<typeof userSchema>;