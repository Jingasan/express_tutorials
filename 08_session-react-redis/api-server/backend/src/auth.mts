import express, { Request, Response, NextFunction } from "express";
import session from "express-session";
import { randomUUID } from "crypto";
import RedisStore from "connect-redis";
import * as IORedis from "ioredis";

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
    username: String(process.env.NODE_API_SERVER_LOGIN_USERNAME),
    password: String(process.env.NODE_API_SERVER_LOGIN_PASSWORD),
  };

  /**
   * Redisセッションストアの設定
   */
  const redisClient = new IORedis.Redis({
    port: Number(process.env.REDIS_SERVER_PORT), // Redisポート番号
    host: String(process.env.REDIS_CONTAINER_IPV4), // Redisホスト名
    username: "default", // needs Redis >= 6
    password: String(process.env.REDIS_SERVER_PASSWORD), // Redisパスワード
    db: 0, // DBインデックス: 0 (default)
  });
  const redisStore = new RedisStore({
    client: redisClient, // Redisクライアント
    prefix: "session:", // キーのPrefix
  });

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
        maxAge: Number(process.env.NODE_API_SERVER_SESSION_TIMEOUT) * 1000, // [Option] Cookieの有効期限[ms]
        secure: "auto", // [Option] auto(default): trueにすると、HTTPS接続のときのみCookieを発行する
        // trueを設定した場合、「app.set("trust proxy", 1)」を設定する必要がある。
        // Proxy背後にExpressを配置すると、Express自体はHTTPで起動するため、Cookieが発行されないが、
        // これを設定しておくことで、Expressは自身がプロキシ背後に配置されていること、
        // 信頼された「X-Forwarded-*」ヘッダーフィールドであることを認識し、Proxy背後でもCookieを発行するようになる。
      },
      store: redisStore, // [Option] セッションストア
    })
  );

  /**
   * セッション削除
   * @param req
   */
  const destroySession = (req: Request): void => {
    // セッションを削除
    req.session.destroy((err) => {
      if (err) {
        console.error(err);
      }
    });
  };

  /**
   * 有効セッション数の制限
   * @param req
   * @param res
   * @returns
   */
  const sessionNumLimitMiddleware = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const maxSessionNum = Number(process.env.NODE_API_SERVER_MAX_SESSION_NUM); // 最大有効セッション数
    const sessions = await redisClient.keys("session:*");
    if (sessions.length >= maxSessionNum) {
      console.info(
        `[INFO] The number of sessions has reached the maximum limit: ${sessions.length}`
      );
      destroySession(req);
      return res.status(429).json({ isAuthenticated: false });
    }
    next();
  };

  /**
   * ログイン確認
   */
  router.get("/isAuthenticated", (req, res) => {
    if (!req.session.isAuthenticated) {
      destroySession(req);
      return res.status(200).json({ isAuthenticated: false });
    }
    return res
      .status(200)
      .json({ isAuthenticated: req.session.isAuthenticated });
  });

  /**
   * ログインAPI
   */
  router.post(
    "/login",
    sessionNumLimitMiddleware,
    (req: Request, res: Response) => {
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
    }
  );

  /**
   * ログアウトAPI
   */
  router.post("/logout", (req: Request, res: Response) => {
    destroySession(req);
    return res.status(200).json({ isAuthenticated: false });
  });

  return router;
};
