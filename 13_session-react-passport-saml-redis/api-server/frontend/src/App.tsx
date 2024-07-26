import React from "react";
import { checkAuthAPI, loginAPI, logoutAPI } from "./CallAPI";
import Shopping from "./Shopping";

/**
 * ログインページ
 */
export default function App() {
  // ログイン済みかどうか
  const [isLogin, setIsLogin] = React.useState(false);

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
    loginAPI();
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
          <br />
          <button onClick={handleLogin}>Login</button>
        </div>
      )}
    </div>
  );
}
