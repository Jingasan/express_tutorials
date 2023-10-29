import express, { Request, Response, NextFunction } from "express";
import session from "express-session";
import passport from "passport";
import LocalStrategy from "passport-local";
import { randomUUID } from "crypto";
import RedisStore from "connect-redis";
import * as IORedis from "ioredis";
import { createHash } from "crypto";
import { dbController } from "./account.mjs";

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
  if (req.isAuthenticated()) {
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
  //   const Account = {
  //     username: String(process.env.NODE_API_SERVER_LOGIN_USERNAME),
  //     password: String(process.env.NODE_API_SERVER_LOGIN_PASSWORD),
  //   };

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
   * デフォルトではセッションはインメモリに保管される(APIサーバーが複数台になるような実運用環境下では利用できない)
   * 実運用環境では必ずRedisやDBをセッションストアとして用いること
   */
  router.use(
    session({
      secret: randomUUID(), // [Must] セッションIDを保存するCookieの署名に使用される, ランダムな値にすることを推奨
      name: "session", // [Option] Cookie名, connect.id(default)(変更推奨)
      rolling: true, // [Option] アクセス時にセッションの有効期限をリセットする
      resave: false, // [Option] true(default):リクエスト中にセッションが変更されなかった場合でも強制的にセッションストアの保存し直す
      saveUninitialized: false, // [Option] true(default): 初期化されていないセッションを強制的にセッションストアに保存する
      cookie: {
        path: "/", // [Option] "/"(default): Cookieを送信するPATH
        httpOnly: true, // [Option] true(default): httpのみで使用, document.cookieを使ってCookieを扱えなくする
        maxAge: Number(process.env.NODE_API_SERVER_SESSION_TIMEOUT) * 1000, // [Option] Cookieの有効期限[ms]
      },
      store: redisStore, // [Option] セッションストア
    })
  );

  /**
   * Passportの初期化
   */
  router.use(passport.initialize());
  router.use(passport.session());

  /**
   * Passportによるローカル認証のロジック
   */
  passport.use(
    "local",
    new LocalStrategy.Strategy(async (username, password, cb) => {
      const registeredPassword = await dbController.getPassword(username);
      // ユーザー名不一致：認証失敗
      if (!registeredPassword) return cb(null, false);
      const hashedPassword = passwordToHash(password);
      // パスワード不一致：認証失敗
      if (registeredPassword !== hashedPassword) return cb(null, false);
      // 認証成功時：ユーザー情報を返す
      return cb(null, { username: username, password: password });
    })
  );

  /**
   * セッションにユーザー情報を格納
   */
  passport.serializeUser((user, cb) => {
    cb(null, user);
  });

  /**
   * セッションからユーザー情報を取得
   */
  passport.deserializeUser((user, cb) => {
    return cb(null, user);
  });

  /**
   * パスワードのハッシュ化
   * アカウント情報を保持するDBには生のパスワードを登録せずに、ハッシュ化したパスワードを登録する
   * @param password パスワード
   * @returns ハッシュ化されたパスワード
   */
  const passwordToHash = (password: string) => {
    const salt = "salt"; // パスワードに追加するソルト
    return createHash("sha256")
      .update(password + salt)
      .digest("hex")
      .toString();
  };

  /**
   * アカウント登録APIのミドルウェア
   * @param req
   * @param res
   * @param next
   * @returns
   */
  const registerCheckMiddleware = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const body = req.body;
    // リクエストボディのチェック
    if (!body.username) return res.status(400).json("NO_USERNAME");
    if (!body.password) return res.status(400).json("NO_PASSWORD");
    // ユーザー名がすでに登録されていないかチェック
    const password = await dbController.getPassword(body.username);
    if (password) return res.status(400).json("USERNAME_ALREADY_REGISTERED");
    next();
  };

  /**
   * アカウント登録API
   */
  router.post("/register", registerCheckMiddleware, async (req, res) => {
    const body = req.body;
    // 新規ログインユーザーの作成
    const hashedPassword = passwordToHash(body.password);
    const result = await dbController.register(body.username, hashedPassword);
    if (!result) return res.status(500).json("INTERNAL SERVER ERROR");
    return res.status(200).json("OK");
  });

  /**
   * ログイン確認API
   */
  router.get("/isAuthenticated", (req, res) => {
    return res.status(200).json({ isAuthenticated: req.isAuthenticated() });
  });

  /**
   * ログインAPI
   */
  router.post(
    "/login",
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    passport.authenticate("local"),
    (_req: Request, res: Response) => {
      return res.status(200).json({ isAuthenticated: true });
    }
  );

  /**
   * ログアウトAPI
   */
  router.post("/logout", (req: Request, res: Response) => {
    // ログアウト
    req.logout((err) => {
      if (err) {
        console.error(err);
        return res.status(500).json("Internal Server Error");
      }
      // セッションを削除
      req.session.destroy((err) => {
        if (err) {
          console.error(err);
          return res.status(500).json("Internal Server Error");
        }
      });
      return res.status(200).json({ isAuthenticated: false });
    });
  });

  return router;
};
