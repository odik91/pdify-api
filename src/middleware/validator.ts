import { RequestHandler, Request, Response, NextFunction } from "express";
import * as yup from "yup";

export const validate = (
  schema: any
): RequestHandler | any => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({ error: "Empty body is not accepted!" });
    }

    try {
      await schema.validate(req.body, { abortEarly: false });
      return next(); // Ensure next is returned
    } catch (error: unknown) {
      if (error instanceof yup.ValidationError) {
        const validationErrors = error.errors; // Get all errors
        return res.status(422).json({ errors: validationErrors });
      }
      return next(error); // Pass unexpected errors to error handler
    }
  };
};
