import axios from "axios";

/**
 * ログイン状態の確認
 * @returns true:ログイン済/false:未ログイン
 */
export const checkAuthAPI = async (): Promise<boolean> => {
  try {
    const response = await axios.get("/api/isAuthenticated");
    return response.data.isAuthenticated;
  } catch (err) {
    console.error(err);
    return false;
  }
};

/**
 * ログインAPI
 * @param username ログインユーザー名
 * @param password ログインパスワード
 * @returns true:ログイン成功/false:ログイン失敗
 */
export const loginAPI = async (
  username: string,
  password: string
): Promise<boolean> => {
  try {
    const response = await axios.post("/api/login", { username, password });
    return response.data.isAuthenticated;
  } catch (err) {
    return false;
  }
};

/**
 * ログアウトAPI
 */
export const logoutAPI = async (): Promise<void> => {
  try {
    await axios.post("/api/logout");
  } catch (err) {
    console.error(err);
  }
};

/**
 * 商品一覧の取得API
 * @returns 商品一覧
 */
export const getProductsAPI = async (): Promise<string[]> => {
  try {
    const res = await axios.get("/api/shopping/get-products");
    return res.data;
  } catch (err) {
    console.error(err);
    return [];
  }
};

/**
 * カートの初期化API
 * @returns カートに入っている商品
 */
export const initCartAPI = async (): Promise<string[]> => {
  try {
    const res = await axios.get("/api/shopping/init-cart");
    return res.data.products;
  } catch (err) {
    console.error(err);
    return [];
  }
};

/**
 * カートに商品を追加するAPI
 * @param name 商品
 */
export const addCartAPI = async (name: string): Promise<string[]> => {
  try {
    const res = await axios.get(`/api/shopping/add-cart?product=${name}`);
    return res.data.products;
  } catch (err) {
    console.error(err);
    return [];
  }
};

/**
 * カートをクリアするAPI
 */
export const clearCartAPI = async (): Promise<string[]> => {
  try {
    const res = await axios.get("/api/shopping/clear-cart");
    return res.data.products;
  } catch (err) {
    console.error(err);
    return [];
  }
};
