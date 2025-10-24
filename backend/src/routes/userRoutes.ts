import { Router } from "express";
import { getLearningPath, getLearningPaths, getUserNotifications, getUserProfile, searchUsersByName, updateLearningPath, updateModuleProgress, getModuleQuizzes, submitModuleQuizAnswers, getSkillAssessments, getSkillAssessment, submitSkillAssessment, getActivityFeed } from "../controller/userController";

const userRouter = Router();

userRouter.get("/profile", getUserProfile);
userRouter.get("/notifications", getUserNotifications);
userRouter.get("/search", searchUsersByName);
userRouter.get("/learning-paths", getLearningPaths);

userRouter.get("/learning-paths/:pathId", getLearningPath);
userRouter.patch("/learning-paths/:pathId/modules/:moduleId/progress", updateModuleProgress);
userRouter.get("/learning-paths/:pathId/modules/:moduleId/quizzes", getModuleQuizzes);
userRouter.post("/learning-paths/:pathId/modules/:moduleId/quizzes/answers", submitModuleQuizAnswers);
// TODO : Implement Human in loop 
userRouter.patch("/learning-paths/:pathId", updateLearningPath);


userRouter.get("/skill-assessments", getSkillAssessments);
userRouter.get("/skill-assessments/:assessmentId", getSkillAssessment);
userRouter.post("/skill-assessments/:assessmentId/submit", submitSkillAssessment);

userRouter.get("/activity-feed", getActivityFeed);

export default userRouter;

