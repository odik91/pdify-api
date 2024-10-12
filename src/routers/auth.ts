import { CreateUser } from "#/@types/user";
import { validate } from "#/middleware/validator";
import User from "#/models/user";
import { CreateUserSchema } from "#/utils/validationSchema";
import { Router } from "express";

const router = Router();

router.post(
  "/create",
  validate(CreateUserSchema),
  async (req: CreateUser, res): Promise<any | unknown> => {
    const { email, password, name } = req.body;
    CreateUserSchema.validate({ email, password, name }).catch((error) => {});

    try {
      const user = await User.create({ name, email, password });
      return res.status(201).json({ user });
    } catch (error: unknown) {
      return res.status(500).json({ error });
    }
  }
);

export default router;
