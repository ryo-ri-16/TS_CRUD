import { beforeEach, afterAll } from "vitest";
import { prisma } from "../lib/prisma";

// テストは互いに独立しているべき（実行順序が変わっても結果が変わらない）。
// 例えば「同じメールアドレスで登録すると409になる」というテストが、
// 前のテストが作った行を拾ってしまうと意図せず成功/失敗が変わってしまう。
// そのため各テストの直前に関連テーブルを空にする。
// Session→Userの順で消すのは外部キー制約（Session.userId → User.id）があるため。
beforeEach(async () => {
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();
});

// 全テスト終了後、Prismaの接続をきちんと閉じる（残るとvitestプロセスが終了しないことがある）
afterAll(async () => {
  await prisma.$disconnect();
});
