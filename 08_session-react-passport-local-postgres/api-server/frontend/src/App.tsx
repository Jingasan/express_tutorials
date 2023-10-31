import React from "react";
import Shopping from "./Shopping";
import { checkAuthAPI, loginAPI, logoutAPI } from "./CallAPI";

/**
 * ログインページ
 */
export default function App() {
  // ログイン済みかどうか
  const [isLogin, setIsLogin] = React.useState(false);
  // 表示メッセージ
  const [displayMessage, setDisplayMessage] = React.useState(<div></div>);
  // ユーザー名／パスワード
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");

  /**
   * 画面の初期化：ログイン状態をチェック
   */
  React.useEffect(() => {
    setDisplayMessage(<div></div>);
    const init = async () => setIsLogin(await checkAuthAPI());
    init();
  }, []);

  /**
   * ログイン処理
   */
  const handleLogin = async () => {
    const res = await loginAPI(username, password);
    // ステータスコード200の場合はログイン
    if (res === 200) setIsLogin(true);
    else setIsLogin(false);
    // エラーメッセージの表示切替
    if (res === 401 || res === false) {
      setDisplayMessage(
        <div style={{ color: "red" }}>エラー：ログイン認証に失敗しました。</div>
      );
    } else if (res === 429) {
      setDisplayMessage(
        <div style={{ color: "red" }}>
          エラー：ログイン数が上限に達しました。
        </div>
      );
    }
  };

  /**
   * ログアウト処理
   */
  const handleLogout = async () => {
    await logoutAPI();
    setIsLogin(false);
  };

  return (
    <div style={{ margin: "30px" }} className="App">
      {isLogin ? (
        <div>
          <Shopping />
          <br />
          <button onClick={handleLogout}>Logout</button>
        </div>
      ) : (
        <div>
          <h1>ログイン画面</h1>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button onClick={handleLogin}>Login</button>
          <br />
          <br />
          {displayMessage}
        </div>
      )}
    </div>
  );
}
