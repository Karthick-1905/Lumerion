import { Router } from "express";
import { getLearningPath, getLearningPaths, getUserProfile, updateLearningPath } from "../controller/userController";

const userRouter = Router();

userRouter.get("/profile", getUserProfile);
userRouter.get("/learning-paths", getLearningPaths);
userRouter.get("/learning-paths/:pathId", getLearningPath);
userRouter.patch("/learning-paths/:pathId", updateLearningPath);

export default userRouter;

