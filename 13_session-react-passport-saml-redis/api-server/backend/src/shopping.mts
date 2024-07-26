import express, { Request, Response } from "express";
import { authMiddleware } from "./auth.mjs";

/**
 * 買い物関連のAPI
 * @returns APIのRouter
 */
export const shoppingRouter = () => {
  const router = express.Router();

  /**
   * 買い物関連のAPIに認証を挟む
   */
  router.use("/", authMiddleware);

  /**
   * 商品一覧API
   */
  router.get("/get-products", (_req: Request, res: Response) => {
    const products = ["りんご", "ぶどう", "バナナ", "キウイ"];
    return res.status(200).json(products);
  });

  /**
   * カートの初期化API
   */
  router.get("/init-cart", (req: Request, res: Response) => {
    if (req.session["cart"]) {
      // セッションからカートに入っている商品を取得して返す
      return res.status(200).json({ products: req.session["cart"] });
    }
    return res.status(200).json({ products: [] });
  });

  /**
   * カートに商品を追加するAPI
   */
  router.get("/add-cart", (req: Request, res: Response) => {
    // セッションのカートに商品を追加する
    if (!req.session["cart"]) {
      req.session["cart"] = [] as string[];
    }
    req.session["cart"].push(req.query["product"] as string);
    return res.status(200).json({ products: req.session["cart"] });
  });

  /**
   * カートの商品をクリアするAPI
   */
  router.get("/clear-cart", (req: Request, res: Response) => {
    // セッションのカートを空にする
    req.session["cart"].splice(0);
    return res.status(200).json({ products: req.session["cart"] });
  });

  return router;
};
