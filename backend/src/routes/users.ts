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

users.post("/", zValidator('json', userSchema), async (c) => {
  const body = c.req.valid('json')

  const user = await prisma.user.create({
    data: {
      name: body.name,
      gender: body.gender as Gender,
      age: body.age,
      description: body.description,
    },
  })
  return c.json(user, 201)
})

export default users