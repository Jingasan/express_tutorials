import axios from "axios";

/**
 * サインアップAPI
 * @param username 新規ログインユーザー名
 * @param password ログインパスワード
 * @returns true:サインアップ成功/false:サインアップ失敗
 */
export const signupAPI = async (
  username: string,
  password: string
): Promise<{ result: boolean; errors: string[] }> => {
  try {
    const apiURL = "/api/signup";
    console.debug(apiURL);
    const response = await axios.post(apiURL, { username, password });
    return { result: response.data.result, errors: [] };
  } catch (err) {
    if (axios.isAxiosError(err) && err.response) {
      return { result: false, errors: err.response.data.errors };
    }
    return { result: false, errors: [] };
  }
};

/**
 * ログイン状態の確認
 * @returns true:ログイン済/false:未ログイン
 */
export const checkAuthAPI = async (): Promise<boolean> => {
  try {
    const apiURL = "/api/isAuthenticated";
    console.debug(apiURL);
    const response = await axios.get(apiURL);
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
 * @returns ステータスコード
 */
export const loginAPI = async (
  username: string,
  password: string
): Promise<number | boolean> => {
  try {
    const apiURL = "/api/login";
    console.debug(apiURL);
    const response = await axios.post(apiURL, { username, password });
    return response.status;
  } catch (err) {
    if (axios.isAxiosError(err) && err.response) {
      return err.response.status;
    }
    return false;
  }
};

/**
 * ログアウトAPI
 */
export const logoutAPI = async (): Promise<void> => {
  try {
    const apiURL = "/api/logout";
    console.debug(apiURL);
    await axios.post(apiURL);
  } catch (err) {
    console.error(err);
  }
};

/**
 * ユーザー削除API
 * @param username 削除対象ユーザー
 * @returns true:削除成功/false:削除失敗
 */
export const userdeleteAPI = async (username: string): Promise<boolean> => {
  try {
    const apiURL = "/api/delete";
    console.debug(apiURL);
    const response = await axios.post(apiURL, { username });
    return response.data.result;
  } catch (err) {
    console.error(err);
    return false;
  }
};

/**
 * 商品一覧の取得API
 * @returns 商品一覧
 */
export const getProductsAPI = async (): Promise<string[]> => {
  try {
    const apiURL = "/api/shopping/get-products";
    console.debug(apiURL);
    const res = await axios.get(apiURL);
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
    const apiURL = "/api/shopping/init-cart";
    console.debug(apiURL);
    const res = await axios.get(apiURL);
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
    const apiURL = `/api/shopping/add-cart?product=${name}`;
    console.debug(apiURL);
    const res = await axios.get(apiURL);
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
    const apiURL = "/api/shopping/clear-cart";
    console.debug(apiURL);
    const res = await axios.get(apiURL);
    return res.data.products;
  } catch (err) {
    console.error(err);
    return [];
  }
};
