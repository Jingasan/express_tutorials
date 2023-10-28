import express, { Application, Request, Response } from "express";
import session from "express-session";
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
    rolling: true, // [Option] アクセス時にセッションの有効期限をリセットする
    resave: true, // [Option] true(default):リクエスト中にセッションが変更されなかった場合でも強制的にセッションストアの保存し直す
    saveUninitialized: true, // [Option] true(default): 初期化されていないセッションを強制的にセッションストアに保存する
    cookie: {
      path: "/", // [Option] "/"(default): Cookieを送信するPATH
      httpOnly: true, // [Option] true(default): httpのみで使用, document.cookieを使ってCookieを扱えなくする
      maxAge: 10 * 1000, // [Option] Cookieの有効期限[ms]
    },
  })
);
// セッションで扱うデータ（SessionData）の型宣言
// → Request.session.isAuthenticatedを扱えるようにする
declare module "express-session" {
  interface SessionData {
    isAuthenticated: boolean;
  }
}
// ログインアカウント
const Account = {
  username: "user",
  password: "password",
};

/**
 * ログインフォーム
 */
app.get("/", (req, res) => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const isAuthenticated = req.session.isAuthenticated || false;
  if (isAuthenticated) {
    res.send(`
		<h1>Welcome, you are logged in!</h1>
		<form action="/logout" method="post">
		  <button type="submit">Logout</button>
		</form>
	  `);
  } else {
    res.send(`
		<h1>Login</h1>
		<form action="/login" method="post">
		  <input type="text" name="username" placeholder="Username" required><br>
		  <input type="password" name="password" placeholder="Password" required><br>
		  <button type="submit">Login</button>
		</form>
	  `);
  }
});

/**
 * ログインAPI
 */
app.post("/login", (req: Request, res: Response) => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const body: {
    username: string;
    password: string;
  } = req.body;
  // ユーザー認証
  if (
    body.username === Account.username &&
    body.password === Account.password
  ) {
    req.session.isAuthenticated = true;
  }
  res.redirect("/");
});

/**
 * ログアウトAPI
 */
app.post("/logout", (req: Request, res: Response) => {
  req.session.isAuthenticated = false;
  res.redirect("/");
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
