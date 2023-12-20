import express, { Application, Request, Response, NextFunction } from "express";
import cors from "cors";
import { logger } from "./logger.mjs";
const app: Application = express();
const PORT = 3000;
// リクエストボディのパース設定
// 1. JSON形式のリクエストボディをパースできるように設定
// 2. フォームの内容をパースできるように設定
// 3. Payload Too Large エラー対策：50MBまでのデータをPOSTできるように設定(default:100kb)
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
// CORS設定
app.use(cors());
// Logger設定
app.use(logger);
// GET
app.get("/", async (req: Request, res: Response, _next: NextFunction) => {
  // ログ出力
  req.log.info("start");
  logger.logger.info("hello");
  return res.status(200).send({
    message: "Hello World!",
  });
});
// サーバーを起動する処理
try {
  app.listen(PORT, () => {
    console.log("server running at port:" + PORT);
  });
} catch (e) {
  if (e instanceof Error) {
    console.error(e.message);
  }
}
