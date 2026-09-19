import z from "zod";

// User の形状バリデーションはfrontendと共通なので @ts-crud/shared-schemas（packages/shared-schemas）
// に集約し、ここではそれを再エクスポートしている。実体は packages/shared-schemas/src/user.ts。
export { userSchema } from "@ts-crud/shared-schemas";
export type { UserInput } from "@ts-crud/shared-schemas";

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
