import User from "#/models/user";
import { generateToken } from "#/utils/helper";
import { CreateUserSchema } from "#/utils/validationSchema";
import { RequestHandler, Response } from "express";
import { CreateUser, VerifyEmailRequest } from "./../@types/user";
import { sendVerificationMail } from "#/utils/mail";
import EmailVerificationToken from "#/models/emailVerificationToken";
import { isValidObjectId } from "mongoose";

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

export const sendReVerificationToken = async (
  req: { body: { userId: string } },
  res: Response
): Promise<any> => {
  const { userId } = req.body;
  const user = await User.findById(userId);

  if (!isValidObjectId(userId))
    return res.status(403).json({ message: "Invalid request!" });

  if (!user) return res.status(403).json({ message: "Invalid request!" });

  if (user.verified) return res.status(403).json({ message: "Email already verified!" });

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
