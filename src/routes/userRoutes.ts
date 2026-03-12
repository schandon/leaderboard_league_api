import { Router } from "express";
import { authMiddleware } from "../middlewares/authMiddleware";
import * as userController from "../controllers/userController";

const router = Router();

router.post("/register", userController.register);
router.post("/login", userController.login);

router.use(authMiddleware);

router.get("/users", userController.findAll);
router.get("/users/:id", userController.findById);
router.put("/users/:id", userController.update);
router.delete("/users/:id", userController.remove);

export default router;
