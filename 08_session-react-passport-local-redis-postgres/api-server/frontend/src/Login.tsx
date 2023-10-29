import React from "react";
import { Link } from "react-router-dom";
import Shopping from "./Shopping";
import { checkAuthAPI, loginAPI, logoutAPI, userdeleteAPI } from "./CallAPI";

/**
 * ログインページ
 */
export default function Login() {
  // ログイン済みかどうか
  const [isLogin, setIsLogin] = React.useState(false);
  // ログイン失敗メッセージを表示するかどうか
  const [isLoginFailedMessage, setIsLoginFailedMessage] = React.useState(false);
  // ユーザー削除成功メッセージを表示するかどうか
  const [isUserDeletedMessage, setIsUserDeletedMessage] = React.useState(false);
  // ユーザー名／パスワード
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");

  /**
   * 画面の初期化：ログイン状態をチェック
   */
  React.useEffect(() => {
    setIsLoginFailedMessage(false);
    setIsUserDeletedMessage(false);
    const init = async () => setIsLogin(await checkAuthAPI());
    init();
  }, []);

  /**
   * ログイン処理
   */
  const handleLogin = async () => {
    const res = await loginAPI(username, password);
    setIsLogin(res);
    setIsLoginFailedMessage(!res);
    setIsUserDeletedMessage(false);
  };

  /**
   * ログアウト処理
   */
  const handleLogout = async () => {
    await logoutAPI();
    setIsLogin(false);
  };

  /**
   * ユーザー削除処理
   */
  const handleDeleteUser = async () => {
    await userdeleteAPI(username);
    setIsLogin(false);
    setIsLoginFailedMessage(false);
    setIsUserDeletedMessage(true);
  };

  return (
    <div style={{ margin: "30px" }} className="App">
      {isLogin ? (
        <div>
          <Shopping />
          <br />
          <button onClick={handleLogout}>Logout</button>
          <button onClick={handleDeleteUser}>Delete User</button>
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
          {isLoginFailedMessage ? (
            <div style={{ color: "red" }}>ログイン失敗</div>
          ) : (
            ""
          )}
          {isUserDeletedMessage ? (
            <div style={{ color: "blue" }}>ユーザーを削除しました</div>
          ) : (
            ""
          )}
          <br />
          <Link to="/Signup">サインアップページへ移動</Link>
        </div>
      )}
    </div>
  );
}
