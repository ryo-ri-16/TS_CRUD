import z from "zod";

export const userSchema = z.object({
  name: z.string().min(1, '名前を入力してください'),
  age: z
    .number()
    .int('年齢は整数で入力してください')
    .min(0, '年齢は0以上で入力してください')
    .max(150, '年齢が不正です')
    .nullable(), // ageは任意なのでnullableに
  gender: z.enum(['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY']),
  description: z
    .string()
    .max(500, '説明は500文字以内で入力してください')
    .nullable(), // descriptionも任意
})

export type UserInput = z.infer<typeof userSchema>

// GET /users の一覧取得で受け付けるクエリパラメータ。
// クエリパラメータはURL上では常に文字列（配列の場合もある）で届くため、
// z.coerce.number() で "2" のような文字列を number に変換してからバリデーションする。
export const userQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  // 名前・メールアドレスの部分一致検索用キーワード（任意）
  search: z.string().trim().min(1).optional(),
  // ソート対象・順序はPrismaのorderByにそのまま渡すため、
  // 想定外の値が入らないようenumで許可するフィールドを限定する
  sortBy: z.enum(["name", "email", "createdAt"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
})

export type UserQuery = z.infer<typeof userQuerySchema>
