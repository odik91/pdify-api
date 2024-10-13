export const generateToken = (lengnth: number = 6) => {
  let otp: string = "";

  for (let i = 0; i < lengnth; i++) {
    const digit = Math.floor(Math.random() * 10);
    otp += digit;
  }

  return otp;
};
