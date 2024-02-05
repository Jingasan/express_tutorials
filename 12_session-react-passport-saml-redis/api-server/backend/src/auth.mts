/**
 * Passportの処理の流れ
 * １．SAMLStrategyでユーザー情報を取得。
 * ２．serializeUserでセッションにユーザー情報を格納。
 * ３．deserializeUserでセッションからユーザー情報を取得。
 * ４．毎度deserializeUserが動くことで、ログイン状態が保持される。
 */
import fs from "fs";
import express, { Request, Response, NextFunction } from "express";
import session from "express-session";
import passport from "passport";
import {
  Strategy as SAMLStrategy,
  Profile,
  VerifiedCallback,
} from "@node-saml/passport-saml";
import { randomUUID } from "crypto";
import RedisStore from "connect-redis";
import { Redis } from "ioredis";

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
  const redisClient = new Redis({
    host: String(process.env.REDIS_CONTAINER_NAME), // Redisホスト名
    port: Number(process.env.REDIS_SERVER_PORT), // Redisポート番号
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
   * デフォルトではセッションはインメモリに保管される
   * → APIサーバーが複数台になるような実運用環境下では利用できない
   * 実運用環境では必ずRedisやDBをセッションストアとして用いること
   */
  router.use(
    session({
      secret: randomUUID(), // [Must] セッションIDを保存するCookieの署名に使用される, ランダムな値にすることを推奨
      name: "session", // [Option] Cookie名, connect.id(default)(変更推奨)
      rolling: true, // [Option] アクセス時にセッションの有効期限をリセットする
      resave: false, // [Option] true(default):リクエスト中にセッションが変更されなかった場合でも強制的にセッションストアに保存し直す
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
   * PassportによるSAML認証のロジック
   */
  passport.use(
    "saml",
    new SAMLStrategy(
      {
        // IdPからのSP側コールバックURL
        callbackUrl: String(process.env.SAML_IDP_SERVER_CALLBACK_URL),
        // IdPのエンドポイント(SAML認証画面URL)
        entryPoint: String(process.env.SAML_IDP_SERVER_ENTRYPOINT),
        // AuthnRequestの発行者名(SAML IdPサーバーに設定されている必要あり)
        issuer: String(process.env.SAML_IDP_SERVER_ISSUER),
        // IdPに設定するサーバー証明書
        cert: fs.readFileSync("idp-public-cert.pem", "utf8"),
      },
      (profile: Profile, done: VerifiedCallback) => {
        return done(null, profile);
      },
      (profile: Profile, done: VerifiedCallback) => {
        return done(null, profile);
      }
    )
  );
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const samlAuthenticate = passport.authenticate("saml", {
    successRedirect: "/", // 認証成功時のリダイレクト先
    failureRedirect: "/", // 認証失敗時のリダイレクト先
    keepSessionInfo: true,
  });

  /**
   * セッションにユーザー情報を格納
   */
  passport.serializeUser((user, cb) => {
    return cb(null, user);
  });

  /**
   * セッションからユーザー情報を取得
   */
  passport.deserializeUser((user, cb) => {
    return cb(null, user);
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
  router.get(
    "/login",
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    samlAuthenticate
  );

  /**
   * IdPからのコールバックURL
   */
  router.post(
    "/saml/login/callback",
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    samlAuthenticate
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

  return router;
};
