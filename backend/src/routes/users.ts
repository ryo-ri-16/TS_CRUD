import { Hono } from "hono";
import { prisma } from "../lib/prisma";
import { Gender } from "../generated/prisma";
import { zValidator } from "@hono/zod-validator";
import { userSchema } from "../schemas/user";

const users = new Hono()

users.get("/", async (c) => {
  const users = await prisma.user.findMany({
    orderBy: {
      id: "asc",
    },
  });

  return c.json(users);
})

users.post("/", zValidator("json", userSchema), async (c) => {
  const body = c.req.valid("json");

  const user = await prisma.user.create({
    data: {
      name: body.name,
      gender: body.gender as Gender,
      age: body.age,
      description: body.description,
    },
  });

  return c.json(user, 201);
});

users.get("/:id", async (c) => {
  const id = Number(c.req.param("id"));

  const user = await prisma.user.findUnique({
    where: {
      id,
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
    const id = Number(c.req.param("id"));
    const body = c.req.valid("json");

    const existingUser = await prisma.user.findUnique({
      where: { id },
    })

    if (!existingUser) {
      return c.json(
        {
          error: "ユーザーが見つかりません",
        },
        404
      );
    }

    const user = await prisma.user.update({
      where: {
        id,
      },
      data: {
        name: body.name,
        age: body.age,
        gender: body.gender as Gender,
        description: body.description,
      },
    });

    return c.json(user);
  }
);

users.delete("/:id", async (c) => {
  const id = Number(c.req.param("id"));

  const existingUser = await prisma.user.findUnique({
    where: { id },
  });

  if (!existingUser) {
    return c.json(
      {
        error: "ユーザーが見つかりません",
      },
      404
    );
  }

  await prisma.user.delete({
    where: {
      id,
    },
  });

  return c.json({
    message: "ユーザーを削除しました",
  });
});

export default users