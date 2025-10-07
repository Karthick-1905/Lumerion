import { Router } from "express";

import {
    acceptFriendRequest,
    declineFriendRequest,
    listFriendRequests,
    listFriends,
    removeFriend,
    sendFriendRequest,
} from "../controller/friendController";
import {
    friendUserIdParamSchema,
    listFriendRequestsSchema,
    listFriendsSchema,
    requestIdParamSchema,
    sendFriendRequestSchema,
} from "../schema/friendSchema";
import { validate } from "../middleware/validateResource";

const friendRouter = Router();

friendRouter.post("/request", validate(sendFriendRequestSchema), sendFriendRequest);
friendRouter.get("/requests", validate(listFriendRequestsSchema), listFriendRequests);
friendRouter.post("/request/:requestId/accept",validate(requestIdParamSchema),acceptFriendRequest);
friendRouter.post("/request/:requestId/decline",validate(requestIdParamSchema),declineFriendRequest);
friendRouter.get("/", validate(listFriendsSchema), listFriends);
friendRouter.delete("/:friendUserId",validate(friendUserIdParamSchema),removeFriend);

export default friendRouter;
