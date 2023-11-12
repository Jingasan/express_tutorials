import { BrowserRouter, Route, Routes } from "react-router-dom";
import Login from "./Login";
import Signup from "./Signup";

/**
 * ルート
 */
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ログインページ */}
        <Route path="/" element={<Login />} />
        {/* サインアップページ */}
        <Route path="/Signup" element={<Signup />} />
      </Routes>
    </BrowserRouter>
  );
}
