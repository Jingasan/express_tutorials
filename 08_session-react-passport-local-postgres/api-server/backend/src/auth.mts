import express, { Request, Response, NextFunction } from "express";
import session from "express-session";
import passport from "passport";
import LocalStrategy from "passport-local";
import { randomUUID } from "crypto";
import Sequlize from "sequelize";
import CSS from "connect-session-sequelize";

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
  const Account = {
    username: String(process.env.NODE_API_SERVER_LOGIN_USERNAME),
    password: String(process.env.NODE_API_SERVER_LOGIN_PASSWORD),
  };

  /**
   * セッションストアの設定
   */
  const SequelizeStore = CSS(session.Store);
  const sequelize = new Sequlize.Sequelize(
    String(process.env.POSTGRES_DB),
    String(process.env.POSTGRES_USER),
    String(process.env.POSTGRES_PASSWORD),
    {
      host: String(process.env.DB_CONTAINER_IPV4),
      port: Number(process.env.DB_SERVER_PORT),
      dialect: "postgres",
    }
  );
  const store = new SequelizeStore({
    db: sequelize, // DBサーバーの設定
    tableName: "session", // セッションを格納するテーブル名
    checkExpirationInterval:
      Number(process.env.NODE_API_SERVER_SESSION_CLEANUP_INTERVAL) * 1000, // DBからの期限切れセッションの削除間隔: 15min (default)
  });
  // DBにセッション保管用のテーブルを作成
  store.sync();

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
      store: store, // [Option] セッションストア
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
    new LocalStrategy.Strategy((username, password, cb) => {
      // 非同期で実行
      process.nextTick(() => {
        if (username !== Account.username) {
          // ユーザー名不一致：認証失敗
          return cb(null, false);
        } else if (password !== Account.password) {
          // パスワード不一致：認証失敗
          return cb(null, false);
        } else {
          // 認証成功時：セッションに含める情報を返す（パスワードは含めないこと）
          return cb(null, { username: Account.username });
        }
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
   * ログイン確認
   */
  router.get("/isAuthenticated", (req, res) => {
    res.status(200).json({ isAuthenticated: req.isAuthenticated() });
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