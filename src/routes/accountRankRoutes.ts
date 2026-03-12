import { Router } from "express";
import { authMiddleware } from "../middlewares/authMiddleware";
import * as accountRankController from "../controllers/accountRankController";

const router = Router();

router.use(authMiddleware);

router.post("/account-ranks", accountRankController.create);
router.get("/account-ranks/account/:accountId/latest", accountRankController.findLatestByAccountId);
router.get("/account-ranks/account/:accountId", accountRankController.findByAccountId);

export default router;
