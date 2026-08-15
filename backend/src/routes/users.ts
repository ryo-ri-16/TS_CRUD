import { Hono } from "hono";
import { prisma } from "../lib/prisma";
import { Gender } from "../generated/prisma";

const users = new Hono()

users.get("/", async (c) => {
  const users = await prisma.user.findMany({
    orderBy: {
      id: "asc",
    },
  });

  return c.json(users);
})

users.post("/", async (c) => {
  const body = await c.req.json()

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