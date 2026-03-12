import { Router } from "express";
import userRoutes from "./userRoutes";
import accountRoutes from "./accountRoutes";
import accountRankRoutes from "./accountRankRoutes";

const router = Router();

router.use(userRoutes);
router.use(accountRoutes);
router.use(accountRankRoutes);

export default router;
