const { env } = process as { env: { [key: string]: string } };
export const {
  MONGO_URI,
  MAILTRAP_USER,
  MAILTRAP_PASSWORD,
  MAIL_HOST,
  VERIFICATION_EMAIL,
  PASSWORD_RESET_LINK,
  SING_IN_URL,
  JWT_SECRET,
  CLOUD_NAME,
  CLOUD_KEY,
  CLOUD_SECRET,
  CLOUDINARY_URL
} = env;
