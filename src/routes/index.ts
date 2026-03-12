import { Router } from "express";
import userRoutes from "./userRoutes";
import accountRoutes from "./accountRoutes";

const router = Router();

router.use(userRoutes);
router.use(accountRoutes);

export default router;
