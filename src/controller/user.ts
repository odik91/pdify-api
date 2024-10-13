import User from "#/models/user";
import { generateToken } from "#/utils/helper";
import { CreateUserSchema } from "#/utils/validationSchema";
import { RequestHandler } from "express";
import { CreateUser } from "./../@types/user";
import { sendVerificationMail } from "#/utils/mail";

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
