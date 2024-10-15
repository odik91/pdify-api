import User from "#/models/user";
import { generateToken } from "#/utils/helper";
import { CreateUserSchema } from "#/utils/validationSchema";
import { RequestHandler, Response } from "express";
import { CreateUser, VerifyEmailRequest } from "./../@types/user";
import {
  sendForgetPasswordLink,
  sendPassResetSuccessEmail,
  sendVerificationMail,
} from "#/utils/mail";
import EmailVerificationToken from "#/models/emailVerificationToken";
import { isValidObjectId } from "mongoose";
import PasswordResetToken from "#/models/passwordResetToken";
import crypto from "crypto";
import { JWT_SECRET, PASSWORD_RESET_LINK } from "#/utils/variable";
import jwt from "jsonwebtoken";

// export const create: RequestHandler = async (req: CreateUser, res: { status: (arg0: number) => { (): any; new(): any; json: { (arg0: { user?: any; error?: unknown; }): any; new(): any; }; }; }): Promise<any | unknown> => {
//   const { email, password, name } = req.body;
//   CreateUserSchema.validate({ email, password, name }).catch((error) => {});

//   try {
//     const user = await User.create({ name, email, password });
//     return res.status(201).json({ user });
//   } catch (error: unknown) {
//     return res.status(500).json({ error });
//   }
// }

export const create: RequestHandler = async (
  req: CreateUser,
  res
): Promise<any | unknown> => {
  const { email, password, name } = req.body;
  CreateUserSchema.validate({ email, password, name }).catch((error) => {});

  try {
    const user = await User.create({ name, email, password });

    // Looking to send emails in production? Check out our Email API/SMTP product!
    // generate token
    const token = generateToken();

    await EmailVerificationToken.create({
      owner: user._id.toString(),
      token,
    });

    sendVerificationMail(token, {
      email,
      name,
      userId: user._id.toString(),
    });

    return res.status(201).json({ id: user._id, name, email });
  } catch (error: unknown) {
    return res.status(500).json({ error });
  }
};

export const verifyEmail: RequestHandler = async (
  req: VerifyEmailRequest,
  res: Response
): Promise<any> => {
  const { token, userId } = req.body;

  const verificationToken = await EmailVerificationToken.findOne({
    owner: userId,
  });

  if (!verificationToken)
    return res.status(403).json({ error: "Invalid token" });

  const matched = await verificationToken.compareToken(token);
  if (!matched) return res.status(403).json({ error: "Invalid token" });

  await User.findByIdAndUpdate(userId, { verified: true });
  await EmailVerificationToken.findByIdAndDelete(verificationToken._id);

  return res.status(200).json({ message: "Your email is verified" });
};

export const sendReVerificationToken: RequestHandler = async (
  req,
  res
): Promise<any> => {
  const { userId } = req.body;
  const user = await User.findById(userId);

  if (!isValidObjectId(userId))
    return res.status(403).json({ message: "Invalid request!" });

  if (!user) return res.status(403).json({ message: "Invalid request!" });

  if (user.verified)
    return res.status(403).json({ message: "Email already verified!" });

  await EmailVerificationToken.findOneAndDelete({ owner: userId });

  const token = generateToken();

  await EmailVerificationToken.create({
    owner: userId,
    token,
  });

  sendVerificationMail(token, {
    email: user?.email,
    name: user?.name,
    userId: user?._id.toString(),
  });

  res.json({ message: "Please check your mail!" });
};

export const generatePasswordLink: RequestHandler = async (
  req,
  res
): Promise<any> => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ message: "Account not found" });

  await PasswordResetToken.findOneAndDelete({ owner: user._id });

  const token = crypto.randomBytes(36).toString("hex");

  // generate the link
  await PasswordResetToken.create({
    owner: user._id,
    token,
  });

  const resetLink = `${PASSWORD_RESET_LINK}?token=${token}&userId=${user._id}`;

  sendForgetPasswordLink({ email: user.email, link: resetLink });

  res.status(200).json({ message: "Check your registered mail." });
};

export const grantValid: RequestHandler = async (req, res): Promise<any> => {
  res.status(200).json({ valid: true });
};

export const updatePassword: RequestHandler = async (
  req,
  res
): Promise<any> => {
  const { password, userId } = req.body;

  const user = await User.findById(userId);
  if (!user) return res.status(403).json({ message: "Unauthorized access!" });

  const matched = await user.comparePassword(password);
  if (matched)
    return res
      .status(422)
      .json({ message: "The new password must be different!" });

  user.password = password;
  await user.save();

  await PasswordResetToken.findOneAndDelete({ owner: user._id });

  // send success message
  sendPassResetSuccessEmail(user.name, user.email);

  res.status(200).json({ message: "Password reset successfully." });
};

export const signIn: RequestHandler = async (
  req: { body: { email: string; password: string } },
  res
): Promise<any> => {
  const { password, email } = req.body;
  const user = await User.findOne({ email });

  if (!user)
    return res.status(403).json({ message: "Email or pasword does not match" });

  const matched = await user.comparePassword(password);
  if (!matched)
    return res.status(403).json({ message: "Email or pasword does not match" });

  // generate token
  const token = jwt.sign({ userId: user._id }, JWT_SECRET);
  user.tokens.push(token);
  await user.save();

  return res.status(200).json({
    profile: {
      id: user._id,
      name: user.name,
      email: user.email,
      verified: user.verified,
      avatar: user.avatar?.url,
      followers: user.followers.length,
      following: user.following.length,
    },
    token,
  });
};
