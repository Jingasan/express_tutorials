import { Sequelize, DataTypes } from "sequelize";
import { setTimeout } from "timers/promises";

/**
 * DBの操作クラス
 */
class DBController {
  /**
   * DBクライアント
   */
  private sequelizeClient = new Sequelize(
    String(process.env.POSTGRES_DB),
    String(process.env.POSTGRES_USER),
    String(process.env.POSTGRES_PASSWORD),
    {
      host: String(process.env.DB_CONTAINER_IPV4),
      port: Number(process.env.DB_SERVER_PORT),
      dialect: "postgres",
      logging: false, // true(default): 実行したSQLコマンドを標準出力する
      // コネクションプールの設定
      pool: {
        max: 10, // 最大接続数
        min: 0, // 最小接続数
        acquire: 30000, // 接続の取得にかかる最大時間[ms]
        idle: 10000, // 接続がアイドル状態になるまでの時間[ms]
      },
    }
  );

  /**
   * モデル(テーブル定義)
   */
  private model = this.sequelizeClient.define(
    "account", // テーブル名
    {
      // カラム
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true, // AUTO_INCREMENT
        allowNull: false, // Not Null
        comment: "ID",
      },
      username: {
        type: DataTypes.TEXT, // 文字列型
        primaryKey: true, // 主キー
        allowNull: false, // Not Null
        comment: "ログインユーザー名",
      },
      password: {
        type: DataTypes.TEXT, // 文字列型
        allowNull: false, // Not Null
        comment: "ログインパスワード",
      },
    }
  );

  /**
   * テーブルの初期化
   * @returns true:成功/false:失敗
   */
  public initTable = async (): Promise<void> => {
    while (true) {
      // DBサーバーが起動するまで待機
      setTimeout(500);
      // テーブル定義の取得
      try {
        // テーブルの初期化
        await this.model.sync({
          force: false, // true:テーブルが存在する場合、削除した上で新規作成する, false:テーブルが存在する場合は何もしない
        });
        break;
      } catch (err) {
        // テーブルの初期化失敗時
        console.error(err);
        continue;
      }
    }
  };

  /**
   * 新規ログインユーザーの作成
   * @param username 新規ログインユーザー名
   * @param password ログインパスワード
   * @returns true:成功/false:失敗
   */
  public register = async (
    username: string,
    password: string
  ): Promise<boolean> => {
    try {
      // データ追加
      await this.model.create({ username: username, password: password });
      return true;
    } catch (err) {
      // データ追加失敗時
      console.error(err);
      return false;
    }
  };

  /**
   * パスワードの取得
   * @param username ログインユーザー名
   * @returns パスワード
   */
  public getPassword = async (username: string): Promise<string | false> => {
    try {
      const res = await this.model.findOne({ where: { username: username } });
      if (!res) return false;
      return res.toJSON().password;
    } catch (err) {
      return false;
    }
  };
}

export const dbController = new DBController();
