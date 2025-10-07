import { Router } from "express";

import {
	createStudyGroup,
	listStudyGroups,
	listUserStudyGroups,
	getStudyGroup,
	addStudyGroupMember,
	respondToStudyGroupInvitation,
	updateStudyGroupMember,
	removeStudyGroupMember,
	listStudyGroupMembers,
} from "../controller/studygroupController";
import {
	createStudyGroupSchema,
	listStudyGroupsSchema,
	userStudyGroupListQuerySchema,
	getStudyGroupSchema,
	addMemberSchema,
	respondToInvitationSchema,
	updateMemberSchema,
	removeMemberSchema,
	listMembersSchema,
} from "../schema/studyGroupSchema";
import { validate } from "../middleware/validateResource";

const studyGroupRouter = Router();

studyGroupRouter.post("/learning-paths/:pathId",validate(createStudyGroupSchema),createStudyGroup);

studyGroupRouter.get("/learning-paths/:pathId",validate(listStudyGroupsSchema),listStudyGroups);

studyGroupRouter.get("/me", validate(userStudyGroupListQuerySchema), listUserStudyGroups);

studyGroupRouter.get("/:groupId",validate(getStudyGroupSchema),getStudyGroup);

studyGroupRouter.post("/:groupId/members",validate(addMemberSchema),addStudyGroupMember);

studyGroupRouter.post("/:groupId/members/respond",validate(respondToInvitationSchema),respondToStudyGroupInvitation);

studyGroupRouter.patch("/:groupId/members/:userId",validate(updateMemberSchema),updateStudyGroupMember);

studyGroupRouter.delete("/:groupId/members/:userId",validate(removeMemberSchema),removeStudyGroupMember);

studyGroupRouter.get("/:groupId/members",validate(listMembersSchema),listStudyGroupMembers);

export default studyGroupRouter;
