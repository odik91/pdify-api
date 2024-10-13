import { RequestHandler } from "express";
import { CreateUser } from "./../@types/user";
import { CreateUserSchema } from "#/utils/validationSchema";
import User from "#/models/user";
import nodemailer from "nodemailer";
import { MAIL_HOST, MAILTRAP_PASSWORD, MAILTRAP_USER } from "#/utils/variable";

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
    const transport = nodemailer.createTransport({
      host: MAIL_HOST,
      port: 2525,
      auth: {
        user: MAILTRAP_USER,
        pass: MAILTRAP_PASSWORD,
      },
    });

    // send mail to user
    const info = await transport.sendMail({
      from: "auth@podify.com",
      to: user.email,
      html: `<h1>Test send email</h1>`,
    });
    console.log("Message sent: %s", info.messageId);

    return res.status(201).json({ user });
  } catch (error: unknown) {
    return res.status(500).json({ error });
  }
};
