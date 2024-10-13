const { env } = process as { env: { [key: string]: string } };
export const {
  MONGO_URI,
  MAILTRAP_USER,
  MAILTRAP_PASSWORD,
  MAIL_HOST,
  VERIFICATION_EMAIL,
} = env;
