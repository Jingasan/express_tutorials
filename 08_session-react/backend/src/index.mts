import express, { Request, Response } from "express";
import cors from "cors";
import { authRouter } from "./auth.mjs";
import { shoppingRouter } from "./shopping.mjs";
const app = express();
const PORT = 8080;
// リクエストボディのパース用設定
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// CORS設定
app.use(cors());

/**
 * 認証関連のAPI
 */
app.use("/", authRouter());

/**
 * 買い物関連のAPI
 */
app.use("/shopping", shoppingRouter());

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
  app.listen(PORT, () => {
    console.log("server running at port:" + PORT);
  });
} catch (e) {
  if (e instanceof Error) {
    console.error(e.message);
  }
}
