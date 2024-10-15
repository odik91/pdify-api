import passwordResetToken from "#/models/passwordResetToken";
import User from "#/models/user";
import { JWT_SECRET } from "#/utils/variable";
import { NextFunction, RequestHandler, Response } from "express";
import { JwtPayload, verify } from "jsonwebtoken";

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

export const mustAuth: RequestHandler = async (
  req,
  res,
  next
): Promise<any> => {
  const { authorization } = req.headers;
  const token = authorization?.split("Bearer ")[1];
  if (!token) return res.status(403).json({ message: "Unauthorized request!" });

  const payload = verify(token, JWT_SECRET) as JwtPayload;
  const id = payload.userId;

  const user = await User.findOne({ _id: id, tokens: token });
  if (!user) return res.status(403).json({ message: "Unatuhorized request!" });

  req.user = {
    id: user._id,
    name: user.name,
    email: user.email,
    verified: user.verified,
    avatar: user.avatar?.url,
    followers: user.followers.length,
    following: user.following.length,
  };

  next();
};
