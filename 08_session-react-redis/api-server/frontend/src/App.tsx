import React from "react";
import Shopping from "./Shopping";
import { checkAuthAPI, loginAPI, logoutAPI } from "./CallAPI";

export default function App() {
  // ログイン済みかどうか
  const [isLogin, setIsLogin] = React.useState(false);
  // ユーザー名／パスワード
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");

  /**
   * 画面の初期化：ログイン状態をチェック
   */
  React.useEffect(() => {
    const init = async () => setIsLogin(await checkAuthAPI());
    init();
  }, []);

  /**
   * ログイン処理
   */
  const handleLogin = async () => {
    setIsLogin(await loginAPI(username, password));
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
        </div>
      )}
    </div>
  );
}
