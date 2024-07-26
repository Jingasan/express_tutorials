import express, { Application, Request, Response } from "express";
import cors from "cors";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import { randomUUID } from "crypto";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// サーバー上でのファイル保存先の設定
const storage = multer.diskStorage({
  destination(_req, _file, callback) {
    callback(null, path.resolve(__dirname, "../dir"));
  },
  filename(_req, file, callback) {
    callback(null, `${randomUUID()}-${file.originalname}`);
  },
});
// 初期設定
const uploader = multer({
  storage,
  fileFilter(_req, file, callback) {
    // ファイル拡張子チェック
    if (["image/png", "image/jpeg"].includes(file.mimetype)) {
      console.log("accept: " + file.mimetype);
      callback(null, true);
      return;
    }
    console.log("reject: " + file.mimetype);
    callback(null, false);
  },
});

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
// 静的ファイルの提供
app.use(express.static("public"));
// POST
app.post("/", uploader.single("file"), (req, res) => {
  console.log(req.file);
  res.redirect("/");
});
// Error 404 Not Found
app.use((_req: Request, res: Response) => {
  return res.status(404).json({ error: "Not Found" });
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
