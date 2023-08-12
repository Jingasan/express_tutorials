import pinoHttp from "pino-http";
// Logger設定
export const logger = pinoHttp({
  level: "info", // 出力するログレベル
  transport: {
    target: "pino/file", // ログをファイルに出力する指定
    options: {
      destination: "./log/out.log", // ログ出力先
      mkdir: true, // ディレクトリがない場合、作成する
    },
  },
});
