import express, { Application } from "express";
import cors from "cors";
const app: Application = express();
const PORT = 3000;
// CORS設定
app.use(cors());
// 静的ファイルの提供
app.use(express.static("public"));
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
