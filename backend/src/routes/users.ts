import { Hono } from "hono";
import { prisma } from "../lib/prisma";
import { Gender } from "../generated/prisma";
import { zValidator } from "@hono/zod-validator";
import { userSchema } from "../schemas/user";
import { authMiddleware } from "../middleware/auth";
import type { Variables } from "../types/context";

const users = new Hono<{
  Variables: Variables;
}>();

users.use("*", authMiddleware);

users.get("/", async (c) => {
  const users = await prisma.user.findMany({
    orderBy: {
      id: "asc",
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

  return c.json(users);
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
  if (currentUserId !== existingUser.id) {
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

  if (currentUserId !== existingUser.id) {
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