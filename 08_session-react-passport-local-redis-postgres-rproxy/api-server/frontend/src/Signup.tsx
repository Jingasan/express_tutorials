import React from "react";
import { Link } from "react-router-dom";
import { signupAPI } from "./CallAPI";

/**
 * サインアップページ
 */
export default function Signup() {
  // 表示メッセージ
  const [displayMessage, setDisplayMessage] = React.useState<JSX.Element>(
    <div></div>
  );
  // ユーザー名／パスワード
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");

  /**
   * 画面の初期化
   */
  React.useEffect(() => {
    // すべてのメッセージを非表示にする
    setDisplayMessage(<div></div>);
  }, []);

  /**
   * サインアップ処理
   */
  const handleSignup = async () => {
    const res = await signupAPI(username, password);
    // メッセージの表示切替
    if (res) {
      setDisplayMessage(<div style={{ color: "blue" }}>サインアップ成功</div>);
    } else {
      setDisplayMessage(<div style={{ color: "red" }}>サインアップ失敗</div>);
    }
  };

  return (
    <div style={{ margin: "30px" }} className="App">
      <h1>サインアップ画面</h1>
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
      <button onClick={handleSignup}>Signup</button>
      <br />
      <br />
      {displayMessage}
      <br />
      <Link to="/">ログインページへ移動</Link>
    </div>
  );
}
