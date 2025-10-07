import { Router } from "express";
import {
	listPublicRoadmaps,
	roadmapGenerator,
	saveRoadmap,
	setLearningPathVisibility,
} from "../controller/roadmapController";
import AuthProvider from "../middleware/authProvider";
import { validate } from "../middleware/validateResource";
import { setLearningPathVisibilitySchema } from "../schema/roadmapSchema";
const roadmapRouter = Router();

roadmapRouter.post("/generate", AuthProvider, roadmapGenerator);
roadmapRouter.post("/save", AuthProvider, saveRoadmap);
roadmapRouter.patch("/learning-paths/:pathId/visibility", AuthProvider, 
    validate(setLearningPathVisibilitySchema), setLearningPathVisibility);
roadmapRouter.get("/public", listPublicRoadmaps);

export default roadmapRouter;