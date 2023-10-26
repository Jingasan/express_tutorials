import express, { Application, Request, Response, NextFunction } from "express";
import cors from "cors";
import { metricsRegistry, http_request_counter } from "./metrics.mjs";
const app: Application = express();
const PORT = 3000;
// リクエストボディのパース用設定
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// CORS設定
app.use(cors());
// HTTPリクエスト数をカウントするミドルウェア
app.use((req: Request, res: Response, next: NextFunction) => {
  http_request_counter
    .labels({
      method: req.method,
      route: req.originalUrl,
      statusCode: res.statusCode,
    })
    .inc();
  next();
});
// GET
app.get("/", async (_req: Request, res: Response, _next: NextFunction) => {
  return res.status(200).send({
    message: "Hello World!",
  });
});
// GET: メトリクス取得API
app.get("/metrics", function (req, res) {
  res.setHeader("Content-Type", metricsRegistry.contentType);
  metricsRegistry.metrics().then((data) => res.status(200).send(data));
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
