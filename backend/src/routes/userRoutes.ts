import express, { Router } from 'express'
import { getUserProfile } from '../controller/userController'
const user_router = Router();

user_router.route('/profile').get(getUserProfile)


export default user_router;

