import { getCookie } from "hono/cookie";
import { createMiddleware } from "hono/factory";
import { prisma } from "../lib/prisma";
import type { Variables } from '../types/context';

export const authMiddleware = createMiddleware<{
  Variables: Variables;
}>(async (c, next) => {
  const sessionId = getCookie(c, "session_id");

  if (!sessionId) {
    return c.json(
      {
        error: "ログインしてください",
      },
      401
    );
  }

  const session = await prisma.session.findUnique({
    where: {
      id: sessionId,
    },
  });

  if (!session) {
    return c.json(
      {
        error: "セッションが無効です",
      },
      401
    );
  }

  if (session.expiresAt < new Date()) {
    await prisma.session.delete({
      where: {
        id: sessionId,
      },
    });

    return c.json(
      {
        error: "セッションの有効期限が切れています",
      },
      401
    );
  }

  c.set("userId", session.userId);

  await next();
});