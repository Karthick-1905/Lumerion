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

type FriendRequestEmailPayload = {
	toEmail: string;
	toName: string;
	fromName: string;
	message?: string | null;
};

type FriendAcceptanceEmailPayload = {
	toEmail: string;
	toName: string;
	friendName: string;
};

export async function sendFriendRequestEmail({
	toEmail,
	toName,
	fromName,
	message,
}: FriendRequestEmailPayload): Promise<boolean> {
	try {
		const mailOptions = {
			from: process.env.SMTP_FROM_EMAIL,
			to: toEmail,
			subject: `${fromName} sent you a friend request`,
			html: `
				<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
					<h2 style="color: #333;">New Friend Request</h2>
					<p>Hello ${toName},</p>
					<p><strong>${fromName}</strong> has sent you a friend request in the Adaptive Learning Platform.</p>
					${message ? `<blockquote style="border-left: 3px solid #007bff; margin: 20px 0; padding-left: 16px; color: #555;">${message}</blockquote>` : ""}
					<p>Visit your dashboard to accept or decline the request.</p>
					<br />
					<p>Best regards,<br />Adaptive Learning Platform</p>
				</div>
			`,
		};

		await transporter.sendMail(mailOptions);
		return true;
	} catch (error) {
		console.error("Error sending friend request email:", error);
		return false;
	}
}

export async function sendFriendAcceptanceEmail({
	toEmail,
	toName,
	friendName,
}: FriendAcceptanceEmailPayload): Promise<boolean> {
	try {
		const mailOptions = {
			from: process.env.SMTP_FROM_EMAIL,
			to: toEmail,
			subject: `${friendName} accepted your friend request`,
			html: `
				<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
					<h2 style="color: #333;">Friend Request Accepted</h2>
					<p>Hello ${toName},</p>
					<p>Great news! <strong>${friendName}</strong> accepted your friend request.</p>
					<p>You can start collaborating right away.</p>
					<br />
					<p>Best regards,<br />Adaptive Learning Platform</p>
				</div>
			`,
		};

		await transporter.sendMail(mailOptions);
		return true;
	} catch (error) {
		console.error("Error sending friend acceptance email:", error);
		return false;
	}
}

export async function verifyFriendMailer(): Promise<boolean> {
	try {
		await transporter.verify();
		return true;
	} catch (error) {
		console.error("Friend mailer configuration error:", error);
		return false;
	}
}
