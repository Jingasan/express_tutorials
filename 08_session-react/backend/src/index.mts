import express, { Application, NextFunction, Request, Response } from "express";
import session from "express-session";
import cors from "cors";
import { randomUUID } from "crypto";
const app: Application = express();
const PORT = 8080;
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
      maxAge: 30 * 1000, // [Option] Cookieの有効期限[ms]
    },
  })
);
// セッションで扱うデータ（SessionData）の型宣言
declare module "express-session" {
  interface SessionData {
    isAuthenticated: boolean;
    cart: string[];
  }
}
// ログインアカウント
const Account = {
  username: "user",
  password: "password",
};

/**
 * ログイン確認
 */
app.get("/isAuthenticated", (req, res) => {
  if (!req.session.isAuthenticated) req.session.isAuthenticated = false;
  res.status(200).json({ isAuthenticated: req.session.isAuthenticated });
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
});

/**
 * ログアウトAPI
 */
app.post("/logout", (req: Request, res: Response) => {
  req.session.isAuthenticated = false;
  req.session.destroy(() => {
    return res.status(200).json({ isAuthenticated: false });
  });
});

/**
 * APIの認証ミドルウェア
 * @param req
 * @param res
 * @param next
 */
const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  if (req.session.isAuthenticated) {
    next();
  } else {
    res.status(401).json({ message: "Authentication required" });
  }
};

/**
 * 買い物関連のAPIに対して認証ミドルウェアによる認証チェックを挟む
 */
app.use("/shopping", authMiddleware);

/**
 * 商品一覧API
 */
app.get("/shopping/get-products", (_req: Request, res: Response) => {
  const products = ["りんご", "ぶどう", "バナナ", "キウイ"];
  return res.status(200).json(products);
});

/**
 * カートの初期化API
 */
app.get("/shopping/init-cart", (req: Request, res: Response) => {
  if (req.session["cart"]) {
    // セッションからカートに入っている商品を取得して返す
    return res.status(200).json({ products: req.session["cart"] });
  }
  return res.status(200).json({ products: [] });
});

/**
 * カートに商品を追加するAPI
 */
app.get("/shopping/add-cart", (req: Request, res: Response) => {
  // セッションのカートに商品を追加する
  if (!req.session["cart"]) {
    req.session["cart"] = [] as string[];
  }
  req.session["cart"].push(req.query["product"] as string);
  return res.status(200).json({ products: req.session["cart"] });
});

/**
 * カートの商品をクリアするAPI
 */
app.get("/shopping/clear-cart", (req: Request, res: Response) => {
  // セッションのカートを空にする
  req.session["cart"].splice(0);
  return res.status(200).json({ products: req.session["cart"] });
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
