import { Hono } from "hono";
import { prisma } from "../lib/prisma";
import { Gender, Prisma } from "../generated/prisma";
import { zValidator } from "@hono/zod-validator";
import { userSchema, userQuerySchema } from "../schemas/user";
import { authMiddleware } from "../middleware/auth";
import type { Variables } from "../types/context";

const users = new Hono<{
  Variables: Variables;
}>();

users.use("*", authMiddleware);

users.get("/", zValidator("query", userQuerySchema), async (c) => {
  const { page, limit, search, sortBy, sortOrder } = c.req.valid("query");

  // 検索キーワードがあれば name / email のどちらかに部分一致（大文字小文字を区別しない）するものを対象にする
  const where: Prisma.UserWhereInput = search
    ? {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
        ],
      }
    : {};

  // 一覧データと件数を並列取得する（$transactionではなくPromise.allなのは、
  // 2つのクエリの間に一貫性を保つ必要がない読み取り専用処理のため）
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: {
        [sortBy]: sortOrder,
      } as Prisma.UserOrderByWithRelationInput,
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        name: true,
        email: true,
        age: true,
        gender: true,
        description: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.user.count({ where }),
  ]);

  return c.json({
    users,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  });
})

users.get("/:id", async (c) => {
  const id = Number(c.req.param("id"));

  const user = await prisma.user.findUnique({
    where: {
      id,
    },
    select: {
      id: true,
      name: true,
      email: true,
      age: true,
      gender: true,
      description: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    return c.json(
      {
        error: "ユーザーが見つかりません",
      },
      404
    );
  }

  return c.json(user);
})

users.patch(
  "/:id",
  zValidator("json", userSchema),
  async (c) => {
    const currentUserId = c.get("userId");
    const targetUserId = Number(c.req.param("id"));

    const body = c.req.valid("json");

    const existingUser = await prisma.user.findUnique({
      where: {
        id: targetUserId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        age: true,
        gender: true,
        description: true,
        createdAt: true,
        updatedAt: true,
      },
    });

  if (!existingUser) {
    return c.json(
      {
        error: "ユーザーが見つかりません",
      },
      404
    );
  }

  // 自分自身のUserか確認
  if (currentUserId !== targetUserId) {
    return c.json(
      {
        error: "このユーザーを編集する権限がありません",
      },
      403
    );
  }

  const user = await prisma.user.update({
    where: {
      id: targetUserId,
    },
    data: {
      name: body.name,
      age: body.age,
      gender: body.gender as Gender,
      description: body.description,
    },
  });

  return c.json(user);
});

users.delete("/:id", async (c) => {
  const currentUserId = c.get("userId");
  const targetUserId = Number(c.req.param("id"));

  const existingUser = await prisma.user.findUnique({
    where: {
      id: targetUserId,
    },
  });

  if (!existingUser) {
    return c.json(
      {
        error: "ユーザーが見つかりません",
      },
      404
    );
  }

  if (currentUserId !== targetUserId) {
    return c.json(
      {
        error: "このユーザーを削除する権限がありません",
      },
      403
    );
  }

  await prisma.user.delete({
    where: {
      id: targetUserId,
    },
  });

  return c.json({
    message: "ユーザーを削除しました",
  });
});

export default users