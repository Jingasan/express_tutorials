import express, { Application, Request, Response, NextFunction } from "express";
import cors from "cors";
import { logger } from "./logger";
const app: Application = express();
const PORT = 3000;
// リクエストボディのパース用設定
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// CORS設定
app.use(cors());
// Logger設定
app.use(logger);
// GET
app.get("/", async (req: Request, res: Response, _next: NextFunction) => {
  // ログ出力
  req.log.info("api endpoint");
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
