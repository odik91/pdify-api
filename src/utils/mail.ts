import { generateTemplate } from "#/mail/template";
import {
  MAIL_HOST,
  MAILTRAP_PASSWORD,
  MAILTRAP_USER,
  SING_IN_URL,
  VERIFICATION_EMAIL,
} from "#/utils/variable";
import nodemailer from "nodemailer";
import path from "path";

const generateMailTransporter = () => {
  return nodemailer.createTransport({
    host: MAIL_HOST,
    port: 2525,
    auth: {
      user: MAILTRAP_USER,
      pass: MAILTRAP_PASSWORD,
    },
  });
};

interface Profile {
  name: string;
  email: string;
  userId: string;
}

export const sendVerificationMail = async (token: string, profile: Profile) => {
  const transport = generateMailTransporter();

  const welcomeMessage = `Hi ${profile.name}, welcome to Posify! There are so much thing that we do for verified users. Use the given OTP to verify your email.`;

  // send mail to user
  await transport.sendMail({
    from: VERIFICATION_EMAIL,
    to: profile.email,
    subject: "Welcome message",
    html: generateTemplate({
      title: "Welcome to Podify",
      message: welcomeMessage,
      logo: "cid:logo",
      banner: "cid:welcome",
      link: "#",
      btnTitle: token,
    }),
    attachments: [
      {
        filename: "logo.png",
        path: path.join(__dirname, "../mail/logo.png"),
        cid: "logo",
      },
      {
        filename: "welcome.png",
        path: path.join(__dirname, "../mail/welcome.png"),
        cid: "welcome",
      },
    ],
  });
  // console.log("Message sent: %s", info.messageId);
};

interface Options {
  email: string;
  link: string;
}

export const sendForgetPasswordLink = async (options: Options) => {
  const { email, link } = options;

  const transport = generateMailTransporter();

  const message =
    "W just received a request that you forget your password. No problem, you cna use the link below and create brand new password";

  // send mail to user
  await transport.sendMail({
    from: VERIFICATION_EMAIL,
    to: email,
    subject: "Reset Password Link",
    html: generateTemplate({
      title: "Forget Password",
      message: message,
      logo: "cid:logo",
      banner: "cid:forget_password",
      link,
      btnTitle: "Reset Password",
    }),
    attachments: [
      {
        filename: "logo.png",
        path: path.join(__dirname, "../mail/logo.png"),
        cid: "logo",
      },
      {
        filename: "forget_password.png",
        path: path.join(__dirname, "../mail/forget_password.png"),
        cid: "forget_password",
      },
    ],
  });
};

export const sendPassResetSuccessEmail = async (
  name: string,
  email: string,
) => {
  const transport = generateMailTransporter();

  const message = `Dear ${name}, we just updated your new password. You can now sign in with your new password.`;

  // send mail to user
  await transport.sendMail({
    from: VERIFICATION_EMAIL,
    to: email,
    subject: "Password Reset Successfully",
    html: generateTemplate({
      title: "Password Reset Successfully",
      message: message,
      logo: "cid:logo",
      banner: "cid:forget_password",
      link: SING_IN_URL,
      btnTitle: "Login",
    }),
    attachments: [
      {
        filename: "logo.png",
        path: path.join(__dirname, "../mail/logo.png"),
        cid: "logo",
      },
      {
        filename: "forget_password.png",
        path: path.join(__dirname, "../mail/forget_password.png"),
        cid: "forget_password",
      },
    ],
  });
};
