/**
 * 処理の流れ
 * １．LocalStrategyでユーザー情報を取得。
 * ２．serializeUserでセッションにユーザー情報を格納。
 * ３．deserializeUserでセッションからユーザー情報を取得。
 * ４．毎度deserializeUserが動くことで、ログイン状態が保持される。
 */
import express, { Application, Request, Response, NextFunction } from "express";
import session from "express-session";
import passport from "passport";
import LocalStrategy from "passport-local";
import cors from "cors";
import { randomUUID } from "crypto";
const app: Application = express();
const PORT = 3000;
// リクエストボディのパース用設定
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// CORS設定
app.use(cors());
// Sessionの設定
app.use(
  session({
    secret: randomUUID(), // [Must] セッションIDを保存するCookieの署名に使用される, ランダムな値にすることを推奨
    name: "session", // [Option] Cookie名, connect.id(default)(変更推奨)
    resave: false, // [Option] true(default):リクエスト中にセッションが変更されなかった場合でも強制的にセッションストアの保存し直す
    saveUninitialized: true, // [Option] true(default): 初期化されていないセッションを強制的にセッションストアに保存する
    cookie: {
      path: "/", // (default): Cookieを送信するPATH
      httpOnly: true, // (default): document.cookieを使ってCookieを扱えなくする
      maxAge: 10 * 1000, // Cookieの有効期限[ms]
    },
  })
);
// Passportの初期化
app.use(passport.initialize());
app.use(passport.session());

// ログインアカウント
const Account = {
  username: "user",
  password: "password",
};

/**
 * Passportによるローカル認証のロジック
 */
passport.use(
  "local",
  new LocalStrategy.Strategy((username, password, cb) => {
    if (username !== Account.username) {
      // ユーザー名不一致：認証失敗
      return cb(null, false);
    } else if (password !== Account.password) {
      // パスワード不一致：認証失敗
      return cb(null, false);
    } else {
      // 認証成功時：ユーザー情報を返す
      return cb(null, { username: username, password: password });
    }
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
 * ログインページ
 */
app.get("/login", (_req: Request, res: Response) => {
  res.send(`
  <html>
  <body>
    <form action="/login" method="post">
	  <input type="text" name="username" placeholder="Username" required><br>
	  <input type="password" name="password" placeholder="Password" required><br>
      <button type="submit">Login</button>
    </form>
  </body>
  </html>
  `);
});

/**
 * ログイン認証
 */
app.post(
  "/login",
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  passport.authenticate("local", {
    failureRedirect: "/login", // 認証失敗した場合の飛び先
    failureFlash: true,
  }),
  (_req: Request, res: Response) => {
    // 認証成功した場合の処理
    res.redirect("/");
  }
);

/**
 * ログイン結果のページ
 */
app.get("/", (req: Request, res: Response) => {
  // ログイン状態を直接「req.user」から調べる
  if (!req.user) {
    // 未ログイン時
    return res.redirect("/login");
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
  const username = String((req.user as any).username);
  res.send(`
  <html>
  <body>
    <div>Login user: ${username}</div>
    <div><a href="/logout">logout</a></div>
  </body>
  </html>
  `);
});

/**
 * ログアウト処理
 */
app.get("/logout", (req: Request, res: Response, next: NextFunction) => {
  // ログアウト
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    // セッションを削除
    req.session.destroy(() => {});
    res.redirect("/");
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
