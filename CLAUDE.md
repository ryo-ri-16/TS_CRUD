# CLAUDE.md

このファイルは、このリポジトリのコードを扱う際に Claude Code (claude.ai/code) に対して与えるガイダンスです。

## プロジェクト概要

これはhono × next.jsでのアプリ作成という学習を目的にしたプロジェクです。
セッションベース認証を備えたユーザーCRUDアプリで、それぞれ独立して起動する2つのパッケージに分かれています。

## 技術スタック
- `frontend/` — Next.js 16 (App Router)、React 19、Tailwind CSS 4
- `backend/` — Hono 4 APIサーバー（`wrangler.jsonc` もあり Cloudflare Workers へのデプロイも可能だが、実行は `tsx`/Node経由）、Prisma 7 ORM、PostgreSQL

この2つはワークスペースツールによるモノレポ統合はされていません（workspacesなし）— それぞれが独自の `package.json`、`node_modules` を持ち、個別に開発・起動します。フロントエンドはハードコードされたURL `http://localhost:3001` でバックエンドを直接呼び出します。

## コマンド

### バックエンド (`backend/`)
```
npm run dev     # tsx watch src/index.ts — :3001 で開発サーバー起動
npm run build   # tsc
npm run start   # node dist/index.js（事前に build が必要）
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
リポジトリルートの `docker-compose.yml` で Postgres 16 が `:5432` で起動します（DB名 `TS_CRUD`、ユーザー/パスワードは `postgres`/`password`）。`backend/.env` とルートの `.env` の両方に Prisma 用の `DATABASE_URL` が定義されています。

## アーキテクチャ

### 認証モデル（JWTではなくセッションCookie）
- パスワードは `argon2` でハッシュ化（`backend/src/lib/password.ts`）。
- ログイン時、ランダムな32バイトの16進セッションID（`backend/src/lib/session.ts`）が `Session` テーブルに保存され（`expiresAt` 付き、ユーザー削除時にカスケード削除）、httpOnlyの `session_id` Cookieとして設定されます。
- `backend/src/middleware/auth.ts`（`authMiddleware`）はCookieを読み取り、`Session` をロードして有効期限をチェックし（期限切れなら削除）、Honoのコンテキストに `userId` をセットします（`c.set("userId", ...)`、型は `backend/src/types/context.ts` の `Variables`）。この middleware は `users.*` の全ルートに適用されていますが（`users.use("*", authMiddleware)`）、`auth.*` のルートには適用されていません — `/auth/me` は middleware を使わず自前でCookie/セッションを再チェックしています。
- 所有者チェック（`currentUserId !== targetUserId`）は middleware ではなく、`backend/src/routes/users.ts` 内の `PATCH`/`DELETE` ハンドラに直接書かれています — そのため `GET /users/:id` では誰のユーザー情報でも閲覧できますが、編集・削除は自分自身のものだけに制限されています。
- フロントエンドにはクライアント側のセッションストアはありません。サーバーコンポーネントはリクエストごとに `next/headers` の `cookies()` から `session_id` Cookieを手動で転送して `/auth/me` を呼び出し（`frontend/app/users/[id]/page.tsx` 参照）、クライアントコンポーネントは fetch 呼び出し時に `credentials: "include"` を付けています。

### バリデーションはフロントエンドとバックエンドで重複している
`User` の形状に対するZodスキーマは、以下の3箇所に独立して存在しており、フィールドを変更する際は手作業で同期を取る必要があります。
- `backend/src/schemas/user.ts`（`userSchema`、`users.ts` の `zValidator` で使用）
- `frontend/app/validations/user-schemas.ts`（`userSchema` / `UserFormData`）
- `frontend/app/users/_schemas/user-schema.ts`（上記とほぼ重複 — バリデーションルールを編集する前に、対象のフォームが実際にどちらをimportしているか確認すること）

`Gender` enum（`MALE | FEMALE | OTHER | PREFER_NOT_TO_SAY`）は `backend/prisma/schema.prisma` で定義されていますが、フロントエンドの各zodスキーマや `frontend/types/user.ts` では文字列リテラルとして手動で再定義されています。共有パッケージが存在しないため、新しいenum値を追加する場合はこれら全箇所とPrismaマイグレーションを更新する必要があります。

### Prismaクライアントの生成先
generatorの出力先は（デフォルトの `node_modules/.prisma` ではなく）`backend/src/generated/prisma` で、`lib/prisma.ts` と `routes/users.ts` から `../generated/prisma` としてimportされています。gitignore対象なので、クローン後やスキーマ変更後は `npx prisma generate` を実行しないとバックエンドの型チェック・起動ができません。`lib/prisma.ts` は `@prisma/adapter-pg` ドライバアダプタを使用しています（Prisma 7では明示的なアダプタが必須で、素の `DATABASE_URL` へのフォールバックはありません）。

### フロントエンドのルーティング/データ取得パターン
App Routerでサーバーコンポーネントとクライアントコンポーネントを併用しています。
- 一覧/詳細ページ（`app/users/page.tsx`、`app/users/[id]/page.tsx`）はサーバーコンポーネントで、`session_id` Cookieを手動で転送しつつバックエンドを直接 `fetch()` し、`cache: "no-store"` を使用しています。
- フォームやミューテーション（`user-form.tsx`、`delete-button.tsx`、`logout-button.tsx`）はクライアントコンポーネント（`"use client"`）で、`credentials: "include"` を付けてバックエンドを呼び出し、`next/navigation` の `useRouter` で処理後のリダイレクト/リフレッシュを行います。
- 共有のAPIクライアントモジュールは存在せず、各コンポーネントがそれぞれハードコードされた `http://localhost:3001/...` へのfetch呼び出しを個別に組み立てています。

### 既存のリポジトリ固有のエージェント向けメモ
- `frontend/CLAUDE.md` / `frontend/AGENTS.md` は、Next.js自身が生成するagent-rulesブロック（`node_modules/next/dist/docs/`）を指しています — このアプリは破壊的変更を含むバージョンのNext.jsを使用しているため、App Routerのコードを書く前に `node_modules` 内のドキュメントを確認してください。
