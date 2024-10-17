import User, { UserDocument } from "#/models/user";
import { formatProfile, generateToken } from "#/utils/helper";
import { CreateUserSchema } from "#/utils/validationSchema";
import { RequestHandler, Response } from "express";
import { CreateUser, VerifyEmailRequest } from "../@types/user";
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
import { RequestWithFiles } from "#/middleware/fileParser";
import cloudinary from "#/cloud";
import formidable from "formidable";

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

export const updateProfile: RequestHandler = async (
  req: RequestWithFiles,
  res
): Promise<any> => {
  const { name } = req.body;
  const avatarArray = req.files?.avatar as formidable.File[];

  const avatar = avatarArray ? avatarArray[0] : null;

  try {
    console.log("req.files:", req.files);
    console.log("avatar:", avatar);
    // Find the user
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: "User not found!" });
    }

    // Validate name
    if (typeof name !== "string" || name.trim().length < 3) {
      return res.status(422).json({ error: "Invalid name!" });
    }

    user.name = name.trim();

    // Handle avatar upload if provided
    if (avatar && avatar.filepath) {
      // If the user already has an avatar, remove the existing one from Cloudinary
      if (user.avatar?.publicId) {
        await cloudinary.uploader.destroy(user.avatar.publicId);
      }

      // Upload new avatar to Cloudinary
      const uploadResult = await cloudinary.uploader.upload(avatar.filepath, {
        width: 300,
        height: 300,
        crop: "thumb",
        gravity: "face",
      });

      // Save new avatar URL and publicId to user profile
      user.avatar = {
        url: uploadResult.secure_url,
        publicId: uploadResult.public_id,
      };
    } else {
      console.error("Avatar file is missing or invalid");
      return res.status(422).json({ error: "Avatar file is missing!" });
    }

    // Save the updated user profile
    await user.save();

    // Respond with the updated avatar
    return res.status(200).json({ profile: formatProfile(user) });
  } catch (error) {
    console.error("Error updating profile:", error);
    return res.status(500).json({ error: "Failed to update profile" });
  }
};

export const sendProfile: RequestHandler = async (req, res): Promise<any> => {
  res.status(200).json({ profile: req.user });
};

export const logOut: RequestHandler = async (req, res): Promise<any> => {
  const { formAll } = req.query;

  const token = req.token;
  const user = await User.findById(req.user.id);
  if (!user)
    return res
      .status(403)
      .json({ message: "Something went wrong, user not found" });

  // logout from all
  if (formAll === "yes") {
    user.tokens = [];
  } else {
    user.tokens = user.tokens.filter((t: string) => t !== token);
  }
  await user.save();

  res.status(200).json({ message: "Logging out..." });
};
