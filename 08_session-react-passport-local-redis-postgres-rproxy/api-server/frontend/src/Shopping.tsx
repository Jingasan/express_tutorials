import React from "react";
import {
  getProductsAPI,
  initCartAPI,
  addCartAPI,
  clearCartAPI,
} from "./CallAPI";

/**
 * 買い物ページ
 */
export default function Shopping() {
  // 商品一覧
  const [products, setProducts] = React.useState<string[]>([]);
  // カート
  const [cart, setCart] = React.useState<string[]>([]);

  /**
   * 買い物画面の初期化：カートの中身を取得
   */
  React.useEffect(() => {
    const init = async () => {
      setProducts(await getProductsAPI());
      setCart(await initCartAPI());
    };
    init();
  }, []);

  /**
   * カートに商品を追加
   * @param name 商品
   */
  const addCart = async (name: string) => {
    setCart(await addCartAPI(name));
  };

  /**
   * カートをクリア
   */
  const clearCart = async () => {
    setCart(await clearCartAPI());
  };

  return (
    <div>
      <h1>買い物画面</h1>
      <div>【かごの中身】</div>
      <div>{cart.join(", ")}</div>
      <br />
      <div>
        <button onClick={() => clearCart()}>かごを空にする</button>
      </div>
      <br />
      <div>【商品一覧】</div>
      {products.map((product, index) => (
        <div key={index}>
          ・{product} <button onClick={() => addCart(product)}>追加</button>
        </div>
      ))}
    </div>
  );
}
