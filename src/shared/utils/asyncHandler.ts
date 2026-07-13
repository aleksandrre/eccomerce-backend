import { Request, Response, NextFunction, RequestHandler } from "express";

/**
 * Wraps an async controller so any thrown error (or rejected promise) is
 * forwarded to Express's central error handler. This removes the repetitive
 * try/catch blocks that were duplicated across every controller.
 *
 * Usage: `router.get("/", asyncHandler(getThings))`
 *        `asyncHandler<AuthRequest>(async (req, res) => { ... })`
 */
export const asyncHandler =
  <Req extends Request = Request>(
    fn: (req: Req, res: Response, next: NextFunction) => Promise<unknown>
  ): RequestHandler =>
  (req, res, next) => {
    fn(req as Req, res, next).catch(next);
  };
