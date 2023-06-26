import express, { Application, Request, Response, NextFunction } from "express";
import cluster from "cluster";
import os from "os";

// Masterプロセスの場合の処理
const cpuNum = os.availableParallelism(); // CPUコア数の取得
if (cluster.isPrimary) {
  console.log(`Master [PID ${process.pid}] is running`);
  // CPUコア数分だけWorkerを生成
  console.log(`Master: Fork ${cpuNum} processes cluster`);
  for (let i = 0; i < cpuNum; i++) {
    cluster.fork();
  }
  // Workerがクラッシュ場合、再生成
  cluster.on("exit", (worker, code, signal) => {
    console.warn(
      `[${worker.id}] Worker died: [PID ${worker.process.pid}] [Signal ${signal}] [Code ${code}]`
    );
    cluster.fork();
  });
}
// Workerプロセスの場合の処理
else {
  // WorkerのID, プロセスIDの表示
  if (cluster.worker)
    console.log(
      `[${cluster.worker.id}] [PID ${cluster.worker.process.pid}] Worker`
    );

  // Express 実装
  const app: Application = express();
  const PORT = 3000;
  // リクエストボディのパース用設定
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // GET
  app.get("/", (_req: Request, res: Response, _next: NextFunction) => {
    if (cluster.worker)
      console.log(
        `[${cluster.worker.id}] [PID ${cluster.worker.process.pid}] Request`
      );
    res.send("Hello World");
  });

  // サーバーを起動する処理
  try {
    app.listen(PORT, () => {
      if (cluster.worker)
        console.log(
          `[${cluster.worker.id}] [PID ${cluster.worker.process.pid}] Server Started with port ${PORT}`
        );
    });
  } catch (e) {
    if (e instanceof Error) {
      console.error(e.message);
    }
  }
}
