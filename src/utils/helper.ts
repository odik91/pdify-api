import { UserDocument } from "#/models/user";

export const generateToken = (lengnth: number = 6) => {
  let otp: string = "";

  for (let i = 0; i < lengnth; i++) {
    const digit = Math.floor(Math.random() * 10);
    otp += digit;
  }

  return otp;
};

export const formatProfile = (user: UserDocument) => {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    verified: user.verified,
    avatar: user.avatar?.url,
    followers: user.followers.length,
    following: user.following.length,
  };
};
