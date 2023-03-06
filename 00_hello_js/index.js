const express = require("express");
const cors = require("cors");
const app = express();
const PORT = 3000;
// リクエストボディのパース用設定
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// CORS設定
app.use(cors());
// GET
app.get("/", async (_req, res) => {
  return res.status(200).send({
    message: "Hello World!",
  });
});
// GET
app.get("/users/:id", (req, res, _next) => {
  return res.status(200).json({ Query: req.query });
});
// POST
app.post("/users/:id", (req, res, _next) => {
  return res.status(200).json({ PostBody: req.body });
});
// PUT
app.put("/users/:id", (req, res, _next) => {
  return res.status(200).json({ RequestHeader: req.headers });
});
// DELETE
app.delete("/users/:id", (req, res, _next) => {
  return res.status(200).json({ URLParams: req.params.id });
});
// Error 404 Not Found
app.use((_req, res, _next) => {
  return res.status(404).json({ error: "Not Found" });
});
// サーバーを起動する処理
try {
  app.listen(PORT, () => {
    console.log("server running at port: " + PORT);
  });
} catch (e) {
  if (e instanceof Error) {
    console.error(e.message);
  }
}
