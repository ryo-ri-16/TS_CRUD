import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    // 開発用DB（backend/.env の DATABASE_URL、ts_crud_test ではない方）を汚さないよう、
    // テスト実行時だけ別のテスト専用DBを向くように process.env を上書きする。
    // backend/src/lib/prisma.ts はこの値を読んでPrisma Clientを作るため、
    // テストファイルが import する時点でこの値になっていれば十分。
    env: {
      DATABASE_URL:
        "postgresql://postgres:password@127.0.0.1:5432/ts_crud_test",
    },
    setupFiles: ["./src/test/setup.ts"],
    // vitestはテストファイルを並列に実行するが、全ファイルが同じテスト用DBを共有し、
    // setup.ts が各テスト前にテーブルを空にするため、並列だと他ファイルの実行中データを消し合う。
    // ファイル単位で直列実行にして衝突を避ける（テストファイルが増えると遅くなるのは許容）。
    fileParallelism: false,
  },
});
