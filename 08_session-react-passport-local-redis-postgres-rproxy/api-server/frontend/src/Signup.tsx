import React from "react";
import { Link } from "react-router-dom";
import { signupAPI } from "./CallAPI";

/**
 * サインアップページ
 */
export default function Signup() {
  // サインアップ成功メッセージを表示するかどうか
  const [isSuccessMessage, setIsSuccessMessage] = React.useState(false);
  // サインアップ失敗メッセージを表示するかどうか
  const [isFailedMessage, setIsFailedMessage] = React.useState(false);
  // ユーザー名／パスワード
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");

  /**
   * 画面の初期化
   */
  React.useEffect(() => {
    // すべてのメッセージを非表示にする
    setIsSuccessMessage(false);
    setIsFailedMessage(false);
  }, []);

  /**
   * サインアップ処理
   */
  const handleSignup = async () => {
    const res = await signupAPI(username, password);
    // メッセージの表示切替
    if (res) {
      setIsSuccessMessage(true);
      setIsFailedMessage(false);
    } else {
      setIsSuccessMessage(false);
      setIsFailedMessage(true);
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
      {isSuccessMessage ? (
        <div style={{ color: "blue" }}>サインアップ成功</div>
      ) : (
        ""
      )}
      {isFailedMessage ? (
        <div style={{ color: "red" }}>サインアップ失敗</div>
      ) : (
        ""
      )}
      <br />
      <Link to="/">ログインページへ移動</Link>
    </div>
  );
}
