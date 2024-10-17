import { getFavorites, toggleFavorite } from "#/controller/favorite";
import { isVerified, mustAuth } from "#/middleware/auth";
import { Router } from "express";

const router = Router()

router.post("/", mustAuth, isVerified, toggleFavorite)
router.get("/", mustAuth, getFavorites)

export default router