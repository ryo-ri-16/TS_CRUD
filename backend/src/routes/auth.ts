import { Hono } from "hono";
import { prisma } from "../lib/prisma";
import { hashPassword } from "../lib/password";
import { zValidator } from "@hono/zod-validator";
import { verifyPassword } from "../lib/password";
import { generateSessionId } from "../lib/session";
import { getCookie, setCookie, deleteCookie } from "hono/cookie";
import { z } from "zod";

const auth = new Hono();

const registerSchema = z.object({
  name: z.string().min(1, "名前を入力してください"),
  email: z.email("正しいメールアドレスを入力してください"),
  password: z.string().min(8, "パスワードは8文字以上で入力してください"),
});

const loginSchema = z.object({
  email: z.email("正しいメールアドレスを入力してください"),
  password: z.string().min(1, "パスワードを入力してください"),
});

auth.post(
  "/register",
  zValidator("json", registerSchema),
  async (c) => {
    const body = c.req.valid("json");

    const existingUser = await prisma.user.findUnique({
      where: {
        email: body.email,
      },
    });

    if (existingUser) {
      return c.json(
        {
          error: "このメールアドレスはすでに登録されています",
        },
        409
      );
    }

    const passwordHash = await hashPassword(body.password);

    const user = await prisma.user.create({
      data: {
        name: body.name,
        email: body.email,
        passwordHash,
      },
    });

    return c.json(
      {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      201
    );
  }
);

auth.post(
  "/login",
  zValidator("json", loginSchema),
  async (c) => {
    const body = c.req.valid("json");

    const user = await prisma.user.findUnique({
      where: {
        email: body.email,
      },
    });

    if (!user) {
      return c.json(
        { error: "メールアドレスまたはパスワードが正しくありません" },
        401
      );
    }

    const isValid = await verifyPassword(
      body.password,
      user.passwordHash
    );

    if (!isValid) {
      return c.json(
        { error: "メールアドレスまたはパスワードが正しくありません" },
        401
      );
    }

    const sessionId = generateSessionId();

    await prisma.session.create({
      data: {
        id: sessionId,
        userId: user.id,
        expiresAt: new Date(
          Date.now() + 1000 * 60 * 60 * 24 * 7
        ),
      },
    });

    setCookie(c, "session_id", sessionId, {
      httpOnly: true, // クライアント側のJavaScriptからアクセスできないようにする
      secure: process.env.NODE_ENV === "production", // HTTPS通信時のみクッキーを送信する
      sameSite: "lax", // クロスサイトリクエスト時にクッキーを送信するかどうかの設定
      path: "/", // クッキーの有効範囲を指定する
      maxAge: 60 * 60 * 24 * 7,
    });

    return c.json({
      message: "ログインしました",
    });
  }
);

auth.get("/me", async (c) => {
  const sessionId = getCookie(c, "session_id");

  if (!sessionId) {
    return c.json(
      {
        error: "ログインしていません",
      },
      401
    );
  }

  const session = await prisma.session.findUnique({
    where: {
      id: sessionId,
    },
    include: {
      user: true,
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
        error: "セッションが期限切れです",
      },
      401
    );
  }

  return c.json({
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    age: session.user.age,
    gender: session.user.gender,
    description: session.user.description,
  });
});

auth.post("/logout", async (c) => {
  const sessionId = getCookie(c, "session_id");

  if (sessionId) {
    await prisma.session.deleteMany({
      where: {
        id: sessionId,
      },
    });
  }

  deleteCookie(c, "session_id");

  return c.json({
    message: "ログアウトしました",
  });
});

export default auth;