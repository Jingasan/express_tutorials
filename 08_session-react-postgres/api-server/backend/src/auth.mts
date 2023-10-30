import express, { Request, Response, NextFunction } from "express";
import session from "express-session";
import { randomUUID } from "crypto";
import { Sequelize, QueryTypes, NUMBER } from "sequelize";
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
   * セッションストアの設定
   */
  const SequelizeStore = CSS(session.Store);
  const sequelize = new Sequelize(
    String(process.env.POSTGRES_DB),
    String(process.env.POSTGRES_USER),
    String(process.env.POSTGRES_PASSWORD),
    {
      host: String(process.env.DB_CONTAINER_IPV4),
      port: Number(process.env.DB_SERVER_PORT),
      dialect: "postgres",
      logging: false, // true(default): 実行したSQLコマンドを標準出力する
      // コネクションプールの設定
      pool: {
        max: Number(process.env.DB_MAX_CONNECTIONS), // 最大接続数
        min: Number(process.env.DB_MIN_CONNECTIONS), // 最小接続数
        acquire: 30000, // 接続の取得にかかる最大時間[ms]
        idle: 10000, // 接続がアイドル状態になるまでの時間[ms]
      },
    }
  );
  const store = new SequelizeStore({
    db: sequelize, // DBサーバーの設定
    tableName: "session", // セッションを格納するテーブル名
    checkExpirationInterval:
      Number(process.env.NODE_API_SERVER_SESSION_CLEANUP_INTERVAL) * 1000, // DBからの期限切れセッションの削除間隔[ms]: 15min (default)
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
    const [result] = await sequelize.query(
      `SELECT COUNT( * ) FROM session WHERE expires > :now`,
      {
        replacements: { now: new Date() },
        type: QueryTypes.SELECT,
      }
    );
    const currentSessionNum = parseInt((result as any).count);
    if (currentSessionNum >= maxSessionNum) {
      console.info(
        `[INFO] Session has reached the maximum limit: ${currentSessionNum}`
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
