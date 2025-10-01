import { Request, Response } from "express";

export const getUserProfile = async (req: Request, res : Response) => {
    res.send("User profile")
}