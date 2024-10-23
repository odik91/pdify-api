import { getHistories, removeHistory, updateHistory } from "#/controller/history";
import { mustAuth } from "#/middleware/auth";
import { validate } from "#/middleware/validator";
import { UpdateHistorySchema } from "#/utils/validationSchema";
import { Router } from "express";

const router = Router();

router.post("/", mustAuth, validate(UpdateHistorySchema), updateHistory);
router.delete("/", mustAuth, removeHistory);
router.get("/", mustAuth, getHistories);

export default router;
