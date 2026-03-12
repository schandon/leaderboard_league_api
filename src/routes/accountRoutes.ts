import { Router } from "express";
import { authMiddleware } from "../middlewares/authMiddleware";
import * as accountController from "../controllers/accountController";

const router = Router();

router.use(authMiddleware);

router.post("/accounts", accountController.create);
router.get("/accounts", accountController.findAll);
router.get("/accounts/user/:userId", accountController.findByUserId);
router.get("/accounts/:id", accountController.findById);
router.put("/accounts/:id", accountController.update);
router.delete("/accounts/:id", accountController.remove);

export default router;
