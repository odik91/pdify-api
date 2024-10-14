import { generateTemplate } from "#/mail/template";
import { MAIL_HOST, MAILTRAP_PASSWORD, MAILTRAP_USER, VERIFICATION_EMAIL } from "#/utils/variable";
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
