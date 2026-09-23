# CLAUDE.md

このファイルは、このリポジトリのコードを扱う際に Claude Code (claude.ai/code) に対して与えるガイダンスです。

## プロジェクト概要

これはhono × next.jsでのアプリ作成という学習を目的にしたプロジェクです。
セッションベース認証を備えたユーザーCRUDアプリで、それぞれ独立して起動する2つのパッケージに分かれています。

## 技術スタック
- `frontend/` — Next.js 16 (App Router)、React 19、Tailwind CSS 4
- `backend/` — Hono 4 APIサーバー（`wrangler.jsonc` もあり Cloudflare Workers へのデプロイも可能だが、実行は `tsx`/Node経由）、Prisma 7 ORM、PostgreSQL

アプリの起動自体は`backend/`と`frontend/`でそれぞれ独立していますが（後述）、npm workspacesでモノレポ化されており、リポジトリルートの `package.json`（`workspaces: ["backend", "frontend", "packages/*"]`）配下に両パッケージと共有パッケージ `packages/shared-schemas` が属しています。依存関係のインストールは **リポジトリルートで `npm install` を1回実行するだけ**でよく（ロックファイルも `package-lock.json` がルートに1つだけ存在し、`backend/`・`frontend/`個別のロックファイルはありません）、共通の依存は極力ルートの`node_modules`にhoistされます（`backend`/`frontend`それぞれの`node_modules`には、バージョンが競合するもの、例えば`typescript`のみがネストされます）。フロントエンドはハードコードされたURL `http://localhost:3001` でバックエンドを直接呼び出します。

## コマンド

### バックエンド (`backend/`)
```
npm run dev     # tsx watch src/index.ts — :3001 で開発サーバー起動
npm run build   # tsc -p tsconfig.build.json（テスト関連ファイルを除外）。outDir未設定のため.jsはソースの隣に出力され、startが参照するdist/は現状生成されない
npm run start   # node dist/index.js（上記の理由で現状は動かない）
npm test        # vitest run — テスト用DB（ts_crud_test）が必要。詳細は「テスト（backend）」参照
npm run test:watch
```
Prisma（スキーマは `backend/prisma/schema.prisma`、クライアントは `backend/src/generated/prisma` に生成）:
```
npx prisma migrate dev      # マイグレーションの作成・適用
npx prisma generate         # スキーマ変更後にクライアントを再生成
npx prisma studio
```
`backend/.claude/skills` 配下に Prisma CLI/クライアントのスキル（`prisma-cli`、`prisma-client-api` など）が用意されています。migrate/generate/deploy 関連のフラグを推測するより、これらのスキルを優先してください。

### フロントエンド (`frontend/`)
```
npm run dev     # next dev — :3000
npm run build
npm run start
npm run lint    # eslint
```

### データベース
リポジトリルートの `docker-compose.yml` で Postgres 16 が `:5432` で起動します（ユーザー/パスワードは `postgres`/`password`）。`backend/.env` とルートの `.env` の両方に Prisma 用の `DATABASE_URL`（`postgresql://postgres:password@localhost:5432/postgres`）が定義されています。

**注意（この開発環境での実態）**: ホスト上のネイティブPostgres（`127.0.0.1:5432` をLISTEN）とDockerコンテナ `ts_crud-db-1` の両方が5432を使っており、アプリが実際に接続しているのは**ネイティブ側**のDB名 `postgres` です（Docker側のDB `TS_CRUD` にはテーブルがなく、`docker exec ts_crud-db-1 psql` で見ても空）。中身を直接確認するときは `PGPASSWORD=password psql -h 127.0.0.1 -p 5432 -U postgres -d postgres` を使ってください。

## アーキテクチャ

### 認証モデル（JWTではなくセッションCookie）
- パスワードは `argon2` でハッシュ化（`backend/src/lib/password.ts`）。
- ログイン時、ランダムな32バイトの16進セッションID（`backend/src/lib/session.ts`）が `Session` テーブルに保存され（`expiresAt` 付き、ユーザー削除時にカスケード削除）、httpOnlyの `session_id` Cookieとして設定されます。
- `backend/src/middleware/auth.ts`（`authMiddleware`）はCookieを読み取り、`Session` をロードして有効期限をチェックし（期限切れなら削除）、Honoのコンテキストに `userId` をセットします（`c.set("userId", ...)`、型は `backend/src/types/context.ts` の `Variables`）。この middleware は `users.*` の全ルートに適用されていますが（`users.use("*", authMiddleware)`）、`auth.*` のルートには適用されていません — `/auth/me` は middleware を使わず自前でCookie/セッションを再チェックしています。
- 所有者チェック（`currentUserId !== targetUserId`）は middleware ではなく、`backend/src/routes/users.ts` 内の `PATCH`/`DELETE` ハンドラに直接書かれています — そのため `GET /users/:id` では誰のユーザー情報でも閲覧できますが、編集・削除は自分自身のものだけに制限されています。
- フロントエンドにはクライアント側のセッションストアはありません。サーバーコンポーネントはリクエストごとに `next/headers` の `cookies()` から `session_id` Cookieを手動で転送して `/auth/me` を呼び出し（`frontend/app/users/[id]/page.tsx` 参照）、クライアントコンポーネントは fetch 呼び出し時に `credentials: "include"` を付けています。

### `User` のバリデーションは共有パッケージ `packages/shared-schemas` に集約されている
`User` の形状に対するZodスキーマ（`userSchema`/`UserInput`）と `Gender` の許可値（`GENDER_VALUES`/`Gender`型）は `packages/shared-schemas/src/user.ts` に一本化されています。backend/frontendはどちらもこれをworkspace依存 `@ts-crud/shared-schemas`（`package.json`の`dependencies`に`"*"`で指定、npm workspacesにより`packages/shared-schemas`へのシンボリックリンクとして解決される）として参照する、ビルドステップなしの構成です。`main`/`types`が`./src/index.ts`（コンパイル前のTS）を直接指しており、backend側は`tsx`が、frontend側はNext.js（Turbopack、App Router）がそれぞれ自動的にトランスパイルします（frontend側で`next.config.ts`に`transpilePackages`を追加する必要はありません — Turbopack + App RouterはワークスペースパッケージのTSを自動でトランスパイルします）。
- `backend/src/schemas/user.ts` は `@ts-crud/shared-schemas` から `userSchema`/`UserInput` を re-export しているだけ（`users.ts`の`zValidator`はこれ経由で共有スキーマを使用）。同ファイルにはbackend専用の一覧取得クエリ用スキーマ `userQuerySchema`/`UserQuery` も定義されています（こちらはfrontendと共有しない）。
- `frontend/app/validations/user-schemas.ts` も同様に re-export のみ（型名`UserFormData`は呼び出し側`user-form.tsx`に合わせたローカルエイリアス）。
- `frontend/types/user.ts` の `User.gender` も `@ts-crud/shared-schemas` の `Gender` 型を使用しています。

ただし `Gender` の実際の値（`MALE | FEMALE | OTHER | PREFER_NOT_TO_SAY`）自体は `backend/prisma/schema.prisma` の `enum Gender` にも独立して存在し続けます。Prisma Client（`backend/src/generated/prisma`）はbackend専用の生成物でfrontendから参照できないため、この部分の重複は共有パッケージ導入後も残っています — 新しいenum値を追加する場合は `schema.prisma`（→マイグレーション）と `packages/shared-schemas/src/user.ts` の `GENDER_VALUES` の両方を更新する必要があります。

### Prismaクライアントの生成先
generatorの出力先は（デフォルトの `node_modules/.prisma` ではなく）`backend/src/generated/prisma` で、`lib/prisma.ts` と `routes/users.ts` から `../generated/prisma` としてimportされています。gitignore対象なので、クローン後やスキーマ変更後は `npx prisma generate` を実行しないとバックエンドの型チェック・起動ができません。`lib/prisma.ts` は `@prisma/adapter-pg` ドライバアダプタを使用しています（Prisma 7では明示的なアダプタが必須で、素の `DATABASE_URL` へのフォールバックはありません）。

### テスト（backend）
vitest + Honoの `app.request()`（HTTPサーバーを起動せず、fetch形式のリクエストをアプリに直接渡す）で、実DBを使ったルートの統合テストを行っています。テストファイルは `backend/src/routes/*.test.ts`。**frontendのテストはまだありません。**
- **`app.ts` と `index.ts` の分離**: Honoアプリの組み立ては `src/app.ts`、`serve()` によるサーバー起動は `src/index.ts`（importするだけで:3001を開くため、テストは必ず `../app` をimportする）。`index.ts` の `export default app` はwrangler（`main: src/index.ts`）用。
- **テスト用DB `ts_crud_test`**: 開発DBと同じネイティブPostgres上の別DB。初回とマイグレーション追加後は次を実行（`migrate deploy` は非対話・データを消さない）:
  ```
  PGPASSWORD=password psql -h 127.0.0.1 -p 5432 -U postgres -d postgres -c "CREATE DATABASE ts_crud_test;"   # 初回のみ
  cd backend && DATABASE_URL="postgresql://postgres:password@127.0.0.1:5432/ts_crud_test" npx prisma migrate deploy
  ```
  `vitest.config.ts` の `test.env` がテスト実行時だけ `DATABASE_URL` をこのDBに上書きする（`lib/prisma.ts` のdotenvは設定済みの環境変数を上書きしない）。
- **データのリセット**: `src/test/setup.ts` が各テスト前に `Session`→`User` を全削除する。全テストファイルが同じDBを共有するため、`vitest.config.ts` で `fileParallelism: false`（直列実行）にしている — 並列にすると他ファイルの実行中データを消し合って失敗する。
- **認証が必要なルート**: `src/test/helpers.ts` の `registerAndLogin(name, email)` が実際の register→login を通して `{ id, cookie }` を返す。ブラウザがないのでCookieは手動で `Cookie` ヘッダーに付ける。大量データが必要なテストは `prisma.user.createMany` で直接投入する（argon2を通さないので速い）。
- **型**: `res.json()` の戻り値は `unknown`。検証したい形に `as` でキャストする（vitestは型チェックしないので、`npx tsc --noEmit` でも確認すること）。
- **既知の不具合**: `PATCH /users/:id` が `passwordHash` をレスポンスに含める（他のルートは `select` で除外）。`users.test.ts` に `it.fails` で記録してあり、修正するとそのテストがエラーになるので `it` に戻すこと。

### フロントエンドのルーティング/データ取得パターン
App Routerでサーバーコンポーネントとクライアントコンポーネントを併用しています。
- 一覧/詳細ページ（`app/users/page.tsx`、`app/users/[id]/page.tsx`）はサーバーコンポーネントで、`session_id` Cookieを手動で転送しつつバックエンドを直接 `fetch()` し、`cache: "no-store"` を使用しています。
- フォームやミューテーション（`user-form.tsx`、`delete-button.tsx`、`logout-button.tsx`）はクライアントコンポーネント（`"use client"`）で、`credentials: "include"` を付けてバックエンドを呼び出し、`next/navigation` の `useRouter` で処理後のリダイレクト/リフレッシュを行います。
- 共有のAPIクライアントモジュールは存在せず、各コンポーネントがそれぞれハードコードされた `http://localhost:3001/...` へのfetch呼び出しを個別に組み立てています。

### 既存のリポジトリ固有のエージェント向けメモ
- `frontend/CLAUDE.md` / `frontend/AGENTS.md` は、Next.js自身が生成するagent-rulesブロック（`node_modules/next/dist/docs/`）を指しています — このアプリは破壊的変更を含むバージョンのNext.jsを使用しているため、App Routerのコードを書く前に `node_modules` 内のドキュメントを確認してください。
