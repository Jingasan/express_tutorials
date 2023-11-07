/**
 * 処理の流れ
 * １．LocalStrategyでユーザー情報を取得。
 * ２．serializeUserでセッションにユーザー情報を格納。
 * ３．deserializeUserでセッションからユーザー情報を取得。
 * ４．毎度deserializeUserが動くことで、ログイン状態が保持される。
 */
import express, { Application, Request, Response } from "express";
import session from "express-session";
import passport from "passport";
import GoogleStrategy from "passport-google-oauth20";
import cors from "cors";
import { randomUUID } from "crypto";
const app: Application = express();
const PORT = 3000;
// Secure Cookieを発行する場合に必要な設定
app.set("trust proxy", 1);
// リクエストボディのパース用設定
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
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
      maxAge: 10 * 1000, // [Option] Cookieの有効期限[ms]
      secure: "auto", // [Option] auto(default): trueにすると、HTTPS接続のときのみCookieを発行する
      // trueを設定した場合、「app.set("trust proxy", 1)」を設定する必要がある。
      // Proxy背後にExpressを配置すると、Express自体はHTTPで起動するため、Cookieが発行されないが、
      // これを設定しておくことで、Expressは自身がプロキシ背後に配置されていること、
      // 信頼された「X-Forwarded-*」ヘッダーフィールドであることを認識し、Proxy背後でもCookieを発行するようになる。
    },
  })
);
// Passportの初期化
app.use(passport.initialize());
app.use(passport.session());

/**
 * PassportによるGoogle認証のロジック
 */
passport.use(
  "google",
  new GoogleStrategy.Strategy(
    {
      clientID: "XXXXXXXXXX", // OAuthクライアントID
      clientSecret: "XXXXXXXXXX", // OAuthクライアントシークレット
      callbackURL: "/auth/callback", // リダイレクト先のAPIURL(GoogleCloudのクライアントIDにも登録されている必要あり)
      passReqToCallback: true, // Callback先にリクエストパラメータを渡すかどうか
    },
    (_req, _accessToken, _refreshToken, profile, cb) => {
      process.nextTick(() => {
        return cb(null, { username: profile.displayName });
      });
    }
  )
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
 * ログインページ
 */
app.get("/", (_req: Request, res: Response) => {
  res.send(`
    <html>
      <body>
        <div><a href="/auth/callback">Googleアカウントでログイン</a></div>
      </body>
    </html>
  `);
});

/**
 * Google認証のリダイレクトAPI
 */
app.get(
  "/auth/callback",
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  passport.authenticate("google", {
    scope: ["email", "profile"], // スコープ
    successRedirect: "/mypage", // 認証成功時のリダイレクト先
    failureRedirect: "/", // 認証失敗時のリダイレクト先
    prompt: "consent", // Google認証ページを開く
  })
);

/**
 * ログイン結果のページ
 */
app.get(
  "/mypage",
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      res.redirect("/");
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
    const username = String((req.user as any).username);
    res.send(`
      <html>
        <body>
          <div>ログインユーザー名：${username}</div>
          <div><a href="/logout">ログアウト</a></div>
        </body>
      </html>
    `);
  }
);

/**
 * ログアウト処理
 */
app.get("/logout", (req: Request, res: Response) => {
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
app.use((_req: Request, res: Response) => {
  return res.status(404).json({ error: "Not Found" });
});

/**
 * サーバーを起動処理
 */
try {
  app.listen(PORT, () => {
    console.log("server running at port:" + PORT);
  });
} catch (e) {
  if (e instanceof Error) {
    console.error(e.message);
  }
}
