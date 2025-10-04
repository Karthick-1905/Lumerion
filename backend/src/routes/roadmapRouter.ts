import {Router, Request, Response} from  'express'
import { roadmapGenerator, saveRoadmap } from '../controller/roadmapController'
import AuthProvider from '../middleware/authProvider'
const roadmap_router = Router()

roadmap_router.route('/generate').post(AuthProvider, roadmapGenerator)
roadmap_router.route('/save').post(AuthProvider, saveRoadmap)

export default roadmap_router