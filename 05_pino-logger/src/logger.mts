import pinoHttp from "pino-http";
import os from "os";
import pino from "pino";

// Logger設定
export const logger = pinoHttp({
  level: "info", // 出力するログレベル
  base: { hostname: os.hostname() }, // Default: {pid: process.pid, hostname: os.hostname()}, undefinedの場合、ログにpidやhostnameを挿入しない
  timestamp: pino.stdTimeFunctions.isoTime, // Default: ms since Unix epoch, false: ログに時刻を出力しない
  transport: {
    target: "pino/file", // ログをファイルに出力する指定
    options: {
      destination: "./log/out.log", // ログ出力先
      mkdir: true, // ディレクトリがない場合、作成する
    },
  },
  // 開発向けのpretty-print（本番は上記のNDJSON形式が望ましい）
  //   transport: {
  //     target: "pino-pretty",
  //     options: {
  //       translateTime: "UTC:yyyy-mm-dd HH:MM:ss.l o",
  //     },
  //   },
});
