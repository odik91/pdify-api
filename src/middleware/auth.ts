import passwordResetToken from "#/models/passwordResetToken";
import { NextFunction, Response } from "express";

export const isValidPassResetToken = async (
  req: { body: { token: string; userId: string } },
  res: Response,
  next: NextFunction
): Promise<any> => {
  const { token, userId } = req.body;

  const resetToken = await passwordResetToken.findOne({ owner: userId });
  if (!resetToken) {
    return res
      .status(403)
      .json({ message: "Unauthorized access, invalid token!" });
  }

  const matched = await resetToken.compareToken(token);

  if (!matched)
    return res
      .status(403)
      .json({ message: "Unauthorized access, invalid token!" });

  next();
};
