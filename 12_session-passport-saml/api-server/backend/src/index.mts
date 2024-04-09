/**
 * 処理の流れ
 * １．SAMLStrategyでユーザー情報を取得。
 * ２．serializeUserでセッションにユーザー情報を格納。
 * ３．deserializeUserでセッションからユーザー情報を取得。
 * ４．毎度deserializeUserが動くことで、ログイン状態が保持される。
 */
import fs from "fs";
import express, { Request, Response } from "express";
import session from "express-session";
import passport from "passport";
import {
  Strategy as SAMLStrategy,
  Profile,
  VerifiedCallback,
} from "@node-saml/passport-saml";
import cors from "cors";
import { randomUUID } from "crypto";
const app = express();
const PORT = Number(process.env.NODE_API_SERVER_INTERNAL_PORT);
// Secure Cookieを発行する場合に必要な設定
app.set("trust proxy", 1);
// リクエストボディのパース設定
// 1. JSON形式のリクエストボディをパースできるように設定
// 2. フォームの内容をパースできるように設定
// 3. Payload Too Large エラー対策：50MBまでのデータをPOSTできるように設定(default:100kb)
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
// CORS設定
app.use(cors());
// Sessionの設定
// デフォルトではセッションはインメモリに保管される(APIサーバーが複数台になるような実運用環境下では利用できない)
// 実運用環境では必ずRedisやDBをセッションストアとして用いること
app.use(
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
      // 信頼された「X-Forwarded-*」ヘッダーフィールドであることを認識し、
      // Proxy背後でもCookieを発行するようになる。
    },
  })
);
// Passportの初期化
app.use(passport.initialize());
app.use(passport.session());

/**
 * PassportによるSAML認証のロジック
 */
passport.use(
  "saml",
  new SAMLStrategy(
    {
      // IdPからコールバックするSPのURL
      callbackUrl: String(process.env.SAML_IDP_SERVER_CALLBACK_URL),
      // IdPのエンドポイント(SAML認証画面URL)
      entryPoint: String(process.env.SAML_IDP_SERVER_ENTRYPOINT),
      // AuthnRequestの発行者名(IdPに設定されている必要あり)
      issuer: String(process.env.SAML_IDP_SERVER_ISSUER),
      // IdPから発行するサーバー証明書公開鍵
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
  successRedirect: "/mypage", // 認証成功時のリダイレクト先
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
 * ログインページ
 */
app.get("/", (_req: Request, res: Response) => {
  return res.send(`
    <html>
      <body>
        <div><a href="/api/login/saml">ログイン</a></div>
      </body>
    </html>
  `);
});

/**
 * SAML認証画面へのリダイレクト
 */
app.get(
  "/api/login/saml",
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  samlAuthenticate
);

/**
 * IdPからのコールバックURL
 */
app.post(
  "/api/saml/login/callback",
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  samlAuthenticate
);

/**
 * ログイン結果のページ
 */
app.get(
  "/mypage",
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.redirect("/");
    }
    return res.send(`
      <html>
        <body>
          <h2>マイページ</h2>
          <textarea id="readonlyTextarea" readonly>${JSON.stringify(req.user, null, "  ")}</textarea>
          <br/><br/>
          <div><a href="/api/logout">ログアウト</a></div>
        </body>
      </html>
    `);
  }
);

/**
 * ログアウト処理
 */
app.get("/api/logout", (req: Request, res: Response) => {
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
      res.redirect("/");
    });
  });
});

/**
 * Error 404 Not Found
 */
app.use((_req: Request, res: Response) =>
  res.status(404).json({ error: "Not Found" })
);

/**
 * サーバーを起動処理
 */
try {
  app.listen(PORT, () => console.log("server running at port:" + PORT));
} catch (e) {
  if (e instanceof Error) console.error(e.message);
}
