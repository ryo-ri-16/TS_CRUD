import { prisma } from "./lib/prisma"
import { Gender } from "./generated/prisma"

async function main() {
  console.log("データベース接続テスト開始")

  const user = await prisma.user.create({
    data: {
      name: "テスト太郎",
      gender: Gender.MALE,
      age: 25,
      description: "はじめまして"
    },
  })
  console.log('✅ ユーザー作成成功:', user)

  const users = await prisma.user.findMany()
  console.log('✅ 全ユーザー取得:', users)

  await prisma.user.delete({ where: { id: user.id } })
  console.log('✅ テストユーザー削除完了')
}

main()
  .catch((e) => {
    console.error('❌ エラー:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })