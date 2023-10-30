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
   * Redisセッションストアの設定
   */
  const redisClient = new IORedis.Redis({
    port: Number(process.env.REDIS_SERVER_PORT), // Redisポート番号
    host: String(process.env.REDIS_CONTAINER_NAME), // Redisホスト名
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
      // 非同期で実行
      process.nextTick(async () => {
        const registeredPassword = await dbController.getPassword(username);
        // ユーザー名不一致：認証失敗
        if (!registeredPassword) return cb(null, false);
        const hashedPassword = passwordToHash(password);
        // パスワード不一致：認証失敗
        if (registeredPassword !== hashedPassword) return cb(null, false);
        // 認証成功時：セッションに含める情報を返す（パスワードは含めないこと）
        return cb(null, { username: username });
      });
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
   * 有効セッション数の制限
   * @param req
   * @param res
   * @returns
   */
  const sessionNumLimitMiddleware = async (
    _req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const maxSessionNum = Number(process.env.NODE_API_SERVER_MAX_SESSION_NUM); // 最大有効セッション数
    const sessions = await redisClient.keys("session:*");
    if (sessions.length >= maxSessionNum) {
      console.info(
        `[INFO] The number of sessions has reached the maximum limit: ${sessions.length}`
      );
      return res.status(429).json({ isAuthenticated: false });
    }
    next();
  };

  /**
   * サインアップAPIのミドルウェア
   * @param req
   * @param res
   * @param next
   * @returns
   */
  const signupCheckMiddleware = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const errors = [];
    const body = req.body;
    // リクエストボディのチェック
    if (!body.username) errors.push("NO_USERNAME");
    if (!body.password) errors.push("NO_PASSWORD");
    if (body.username && body.password) {
      // ユーザー名がすでに登録されていないかチェック
      const password = await dbController.getPassword(body.username);
      if (password) errors.push("USERNAME_ALREADY_EXISTS");
    }
    if (errors.length > 0)
      return res.status(400).json({ result: false, errors: errors });
    next();
  };

  /**
   * サインアップAPI
   */
  router.post("/signup", signupCheckMiddleware, async (req, res) => {
    const body = req.body;
    // 新規ログインユーザーの作成
    const hashedPassword = passwordToHash(body.password);
    const result = await dbController.register(body.username, hashedPassword);
    if (!result)
      return res
        .status(500)
        .json({ result: false, errors: ["INTERNAL_SERVER_ERROR"] });
    return res.status(200).json({ result: true, errors: [] });
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
    sessionNumLimitMiddleware,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    passport.authenticate("local"),
    (_req: Request, res: Response) => {
      return res.status(200).json({ isAuthenticated: true });
    }
  );

  /**
   * セッション削除
   * @param req
   */
  const destroySession = (req: Request): void => {
    // ログアウト
    req.logout((err) => {
      if (err) {
        console.error(err);
        return;
      }
      // セッションを削除
      req.session.destroy((err) => {
        if (err) {
          console.error(err);
        }
      });
    });
  };

  /**
   * ログアウトAPI
   */
  router.post("/logout", authMiddleware, (req: Request, res: Response) => {
    destroySession(req);
    return res.status(200).json({ isAuthenticated: false });
  });

  /**
   * ユーザー削除APIのミドルウェア
   * @param req
   * @param res
   * @param next
   * @returns
   */
  const deleteUserCheckMiddleware = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const errors = [];
    const body = req.body;
    // リクエストボディにユーザー名が含まれているかチェック
    if (!body.username) {
      errors.push("NO_USERNAME");
    } else {
      // ユーザーが登録されているかチェック
      const password = await dbController.getPassword(body.username);
      if (!password) errors.push("USERNAME_NOT_EXISTS");
    }
    if (errors.length > 0) {
      return res.status(400).json({ result: false, errors: errors });
    } else {
      next();
    }
  };

  /**
   * ユーザー削除API
   */
  router.post(
    "/delete",
    authMiddleware,
    deleteUserCheckMiddleware,
    async (req: Request, res: Response) => {
      const body = req.body;
      // ログインユーザーの削除
      const result = await dbController.unregister(body.username);
      if (!result)
        return res
          .status(500)
          .json({ result: false, errors: ["INTERNAL_SERVER_ERROR"] });
      // ログアウト
      destroySession(req);
      return res.status(200).json({ result: true, errors: [] });
    }
  );

  return router;
};
