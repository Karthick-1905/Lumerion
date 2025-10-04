import 'dotenv/config';
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
	host: process.env.SMTP_HOST,
	port: parseInt(process.env.SMTP_PORT || "587", 10),
	secure: process.env.SMTP_SECURE === "true",
	auth: {
		user: process.env.SMTP_USER,
		pass: process.env.SMTP_PASS,
	},
});

type StudyGroupInvitePayload = {
	toEmail: string;
	toName: string;
	inviterName: string;
	groupName: string;
	pathTitle?: string | null;
	message?: string | null;
	inviteLink?: string | null;
};

type StudyGroupAdminNotificationPayload = {
	toEmail: string;
	toName: string;
	groupName: string;
	memberName: string;
};

export async function sendStudyGroupInviteEmail({
	toEmail,
	toName,
	inviterName,
	groupName,
	pathTitle,
	message,
	inviteLink,
}: StudyGroupInvitePayload): Promise<boolean> {
	try {
		const callToAction = inviteLink
			? `<div style="text-align: center; margin: 24px 0;"><a href="${inviteLink}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Join Study Group</a></div>`
			: "";

		const mailOptions = {
			from: process.env.SMTP_FROM_EMAIL,
			to: toEmail,
			subject: `${inviterName} invited you to join ${groupName}`,
			html: `
				<div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto;">
					<h2 style="color: #333;">You've been invited to a study group!</h2>
					<p>Hello ${toName},</p>
					<p><strong>${inviterName}</strong> has invited you to collaborate in the <strong>${groupName}</strong> study group${pathTitle ? ` for the learning path <em>${pathTitle}</em>` : ""}.</p>
					${message ? `<blockquote style="border-left: 3px solid #6c63ff; margin: 20px 0; padding: 0 16px; color: #555;">${message}</blockquote>` : ""}
					<p>Accept the invitation to access shared resources, schedule sessions, and stay in sync with the team.</p>
					${callToAction}
					<p>If the button doesn't work, copy and paste the link below into your browser:</p>
					${inviteLink ? `<p style="word-break: break-all; color: #007bff;">${inviteLink}</p>` : ""}
					<br />
					<p>Happy learning!<br />Adaptive Learning Platform</p>
				</div>
			`,
		};

		await transporter.sendMail(mailOptions);
		return true;
	} catch (error) {
		console.error("Error sending study group invite email:", error);
		return false;
	}
}

export async function sendStudyGroupAdminNotification({
	toEmail,
	toName,
	groupName,
	memberName,
}: StudyGroupAdminNotificationPayload): Promise<boolean> {
	try {
		const mailOptions = {
			from: process.env.SMTP_FROM_EMAIL,
			to: toEmail,
			subject: `${memberName} joined your study group ${groupName}`,
			html: `
				<div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto;">
					<h2 style="color: #333;">New group member</h2>
					<p>Hello ${toName},</p>
					<p><strong>${memberName}</strong> has just joined your study group <strong>${groupName}</strong>.</p>
					<p>You can adjust roles and permissions from the group settings panel.</p>
					<br />
					<p>Best regards,<br />Adaptive Learning Platform</p>
				</div>
			`,
		};

		await transporter.sendMail(mailOptions);
		return true;
	} catch (error) {
		console.error("Error sending study group admin notification email:", error);
		return false;
	}
}

export async function verifyStudyGroupMailer(): Promise<boolean> {
	try {
		await transporter.verify();
		return true;
	} catch (error) {
		console.error("Study group mailer configuration error:", error);
		return false;
	}
}
