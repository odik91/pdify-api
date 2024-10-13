import { create } from "#/controller/user";
import { validate } from "#/middleware/validator";
import { CreateUserSchema } from "#/utils/validationSchema";
import { Router } from "express";

const router = Router();

router.post("/create", validate(CreateUserSchema), create);

export default router;
