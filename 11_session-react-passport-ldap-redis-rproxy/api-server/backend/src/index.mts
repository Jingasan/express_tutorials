import express, { Request, Response } from "express";
import cors from "cors";
import { authRouter } from "./auth.mjs";
import { shoppingRouter } from "./shopping.mjs";
const app = express();
const PORT = Number(process.env.NODE_API_SERVER_PORT);
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
// Webページの提供
app.use(express.static("/frontend"));

/**
 * 認証関連のAPI
 */
app.use("/api", authRouter());

/**
 * 買い物関連のAPI
 */
app.use("/api/shopping", shoppingRouter());

/**
 * Error 404 Not Found
 */
app.use((_req: Request, res: Response) => {
  return res.status(404).json({ error: "Not Found" });
});

/**
 * サーバーの起動処理
 */
try {
  app.listen(PORT, () => console.log("server running at port:" + PORT));
} catch (e) {
  if (e instanceof Error) console.error(e.message);
  process.exit(-1);
}
