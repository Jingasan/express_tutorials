import express, { Application, Request, Response } from "express";
import cookieSession from "cookie-session";
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
// cookie-sessionではセッションをすべてCookieに保存する
app.use(
  cookieSession({
    name: "session", // [Option] Cookie名
    keys: [randomUUID()], // [Option] セッションの署名に使用する鍵
    path: "/", // [Option] "/"(default): Cookieを送信するPATH
    httpOnly: true, // [Option] true(default): httpのみで使用, document.cookieを使ってCookieを扱えなくする
    maxAge: 10 * 1000, // [Option] Cookieの有効期限[ms]
    secure: false, // [Option] false(default) trueにすると、HTTPS接続のときのみCookieを発行する
    // trueを設定した場合、「app.set("trust proxy", 1)」を設定する必要がある。
    // Proxy背後にExpressを配置すると、Express自体はHTTPで起動するため、Cookieが発行されないが、
    // これを設定しておくことで、Expressは自身がプロキシ背後に配置されていること、
    // 信頼された「X-Forwarded-*」ヘッダーフィールドであることを認識し、Proxy背後でもCookieを発行するようになる。
  })
);
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
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const user = req.session.user;
  if (isAuthenticated) {
    res.send(`
      <h1>Welcome, ${user}</h1>
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
    req.session.user = Account.username;
  }
  res.redirect("/");
});

/**
 * ログアウトAPI
 */
app.post("/logout", (req: Request, res: Response) => {
  req.session = null;
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
