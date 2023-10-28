import express, { Request, Response, NextFunction } from "express";
import session from "express-session";
import { randomUUID } from "crypto";

// セッションで扱うデータ（SessionData）の型宣言
declare module "express-session" {
  interface SessionData {
    isAuthenticated: boolean;
    cart: string[];
  }
}

/**
 * APIの認証ミドルウェア
 * @param req
 * @param res
 * @param next
 */
export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (req.session.isAuthenticated) {
    next();
  } else {
    res.status(401).json({ message: "Authentication required" });
  }
};

/**
 * 認証関連のAPI
 * @returns APIのRouter
 */
export const authRouter = () => {
  const router = express.Router();

  /**
   * ログインアカウント
   */
  const Account = {
    username: "user",
    password: "password",
  };

  /**
   * セッションの設定
   */
  router.use(
    session({
      secret: randomUUID(), // [Must] セッションIDを保存するCookieの署名に使用される, ランダムな値にすることを推奨
      name: "session", // [Option] Cookie名, connect.id(default)(変更推奨)
      rolling: true, // [Option] アクセス時にセッションの有効期限をリセットする
      resave: true, // [Option] true(default):リクエスト中にセッションが変更されなかった場合でも強制的にセッションストアの保存し直す
      saveUninitialized: true, // [Option] true(default): 初期化されていないセッションを強制的にセッションストアに保存する
      cookie: {
        path: "/", // [Option] "/"(default): Cookieを送信するPATH
        httpOnly: true, // [Option] true(default): httpのみで使用, document.cookieを使ってCookieを扱えなくする
        maxAge: 30 * 1000, // [Option] Cookieの有効期限[ms]
      },
    })
  );

  /**
   * ログイン確認
   */
  router.get("/isAuthenticated", (req, res) => {
    if (!req.session.isAuthenticated) req.session.isAuthenticated = false;
    res.status(200).json({ isAuthenticated: req.session.isAuthenticated });
  });

  /**
   * ログインAPI
   */
  router.post("/login", (req: Request, res: Response) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const body: {
      username: string;
      password: string;
    } = req.body;
    // 認証処理
    if (
      body.username === Account.username &&
      body.password === Account.password
    ) {
      req.session.isAuthenticated = true;
      return res.status(200).json({ isAuthenticated: true });
    } else {
      return res.status(401).json({ isAuthenticated: false });
    }
  });

  /**
   * ログアウトAPI
   */
  router.post("/logout", (req: Request, res: Response) => {
    req.session.isAuthenticated = false;
    req.session.destroy((err) => {
      if (err) {
        console.error(err);
        return res.status(500).json("Internal Server Error");
      }
      return res.status(200).json({ isAuthenticated: false });
    });
  });

  return router;
};
