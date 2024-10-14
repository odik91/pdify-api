import { create, generatePasswordLink, sendReVerificationToken, verifyEmail } from "#/controller/user";
import { validate } from "#/middleware/validator";
import { CreateUserSchema, EmailVerificationBody } from "#/utils/validationSchema";
import { Router } from "express";

const router = Router();

router.post("/create", validate(CreateUserSchema), create);
router.post("/verify-email", validate(EmailVerificationBody), verifyEmail);
router.post("/re-verify-email", sendReVerificationToken);
router.post("/forget-pasword", generatePasswordLink);

export default router;
