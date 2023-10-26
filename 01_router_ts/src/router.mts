import express, { Router, Request, Response, NextFunction } from "express";
export const GetRouter = () => {
  const router: Router = express.Router();
  // GET /users/:id
  router.get(
    "/:id",
    async (req: Request, res: Response, _next: NextFunction) => {
      return res.status(200).json({ Query: req.query });
    }
  );
  // POST /users/:id
  router.post(
    "/:id",
    async (req: Request, res: Response, _next: NextFunction) => {
      return res.status(200).json({ PostBody: req.body });
    }
  );
  // PUT /users/:id
  router.put(
    "/:id",
    async (req: Request, res: Response, _next: NextFunction) => {
      return res.status(200).json({ RequestHeader: req.headers });
    }
  );
  // DELETE /users/:id
  router.delete(
    "/:id",
    async (req: Request, res: Response, _next: NextFunction) => {
      return res.status(200).json({ URLParams: req.params.id });
    }
  );
  return router;
};
