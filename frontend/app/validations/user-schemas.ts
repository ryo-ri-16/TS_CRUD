// User の形状バリデーションはbackendと共通なので @ts-crud/shared-schemas（packages/shared-schemas）
// に集約し、ここではそれを再エクスポートしている。実体は packages/shared-schemas/src/user.ts。
// 型名 UserFormData は既存の呼び出し側（user-form.tsx）に合わせたローカルエイリアス。
export { userSchema } from "@ts-crud/shared-schemas";
export type { UserInput as UserFormData } from "@ts-crud/shared-schemas";
