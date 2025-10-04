import { NextFunction, Request, Response } from "express";
import {StatusCodes} from 'http-status-codes'
import { getSession } from "../utils/authUtils";


const AuthProvider = async (req: Request ,  res: Response, next: NextFunction) => {
    try {
        const cookies = req.cookies;
        const sessionID  = cookies["session-id"]
        console.log("Session ID from cookies: ", sessionID);
        if(sessionID == null || sessionID == undefined){
            return res.status(StatusCodes.UNAUTHORIZED).json({message : "You are not Authorized to The route", success : false})
        }
        const isValidSession = await getSession(sessionID);
        if(!isValidSession){
            return res.status(StatusCodes.UNAUTHORIZED).json({message : "Invalid Session, Please login again", success : false})
        }
        req.user_id = isValidSession.userId
        console.log("User ID from session: ", req.user_id);
        next()
    } catch (error) {
        console.log(error)
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({message : "Error in The server, Try after sometime", success : false})
    }
}

export default AuthProvider