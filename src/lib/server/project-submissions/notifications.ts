import nodemailer from 'nodemailer';
import { env } from '$env/dynamic/private';

const defaultNotificationRecipient = 'editions@afleurdelignes.com';

type ProjectSubmissionNotification = {
	id: number;
	fullName: string;
	email: string;
	message: string;
	files: {
		originalName: string;
		mimeType: string;
		byteSize: number;
	}[];
};

export async function sendProjectSubmissionNotification(submission: ProjectSubmissionNotification) {
	const host = env.SMTP_HOST;

	if (!host) {
		console.warn('SMTP_HOST is not set. Project submission notification email was not sent.');
		return;
	}

	const port = Number(env.SMTP_PORT ?? 587);
	const secure = env.SMTP_SECURE === 'true' || port === 465;
	const from =
		env.SMTP_FROM ?? env.SMTP_USER ?? `A fleur de lignes <${defaultNotificationRecipient}>`;
	const to = env.PROJECT_SUBMISSION_NOTIFICATION_TO ?? defaultNotificationRecipient;
	const adminUrl = env.ORIGIN ? `${env.ORIGIN.replace(/\/+$/, '')}/admin/projects` : null;

	const transporter = nodemailer.createTransport({
		host,
		port,
		secure,
		auth: env.SMTP_USER
			? {
					user: env.SMTP_USER,
					pass: env.SMTP_PASSWORD
				}
			: undefined
	});

	await transporter.sendMail({
		from,
		to,
		replyTo: submission.email,
		subject: `Nouveau dépôt de projet - ${submission.fullName}`,
		text: renderTextEmail(submission, adminUrl),
		html: renderHtmlEmail(submission, adminUrl)
	});
}

function renderTextEmail(submission: ProjectSubmissionNotification, adminUrl: string | null) {
	const files = submission.files
		.map((file) => `- ${file.originalName} (${file.mimeType}, ${formatFileSize(file.byteSize)})`)
		.join('\n');

	return [
		'Nouveau dépôt de projet',
		'',
		`Porteur : ${submission.fullName}`,
		`Email : ${submission.email}`,
		`Nombre de fichiers : ${submission.files.length}`,
		'',
		'Fichiers :',
		files,
		'',
		'Message :',
		submission.message || 'Aucun message.',
		...(adminUrl ? ['', `Voir dans l'admin : ${adminUrl}`] : [])
	].join('\n');
}

function renderHtmlEmail(submission: ProjectSubmissionNotification, adminUrl: string | null) {
	const fileItems = submission.files
		.map(
			(file) =>
				`<li><strong>${escapeHtml(file.originalName)}</strong> <span>(${escapeHtml(file.mimeType)}, ${formatFileSize(file.byteSize)})</span></li>`
		)
		.join('');

	return `
		<div style="font-family: Arial, sans-serif; color: #1f1d1a; line-height: 1.5;">
			<h1 style="font-size: 22px; margin: 0 0 16px;">Nouveau dépôt de projet</h1>
			<p><strong>Porteur :</strong> ${escapeHtml(submission.fullName)}</p>
			<p><strong>Email :</strong> <a href="mailto:${escapeHtml(submission.email)}">${escapeHtml(submission.email)}</a></p>
			<p><strong>Nombre de fichiers :</strong> ${submission.files.length}</p>
			<h2 style="font-size: 16px; margin: 20px 0 8px;">Fichiers</h2>
			<ul>${fileItems}</ul>
			<h2 style="font-size: 16px; margin: 20px 0 8px;">Message</h2>
			<p style="white-space: pre-wrap;">${escapeHtml(submission.message || 'Aucun message.')}</p>
			${
				adminUrl
					? `<p style="margin-top: 20px;"><a href="${escapeHtml(adminUrl)}" style="display: inline-block; padding: 10px 14px; background: #1f1d1a; color: #fff; text-decoration: none;">Voir dans l'admin</a></p>`
					: ''
			}
		</div>
	`;
}

function formatFileSize(bytes: number) {
	if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} Ko`;
	return `${(bytes / 1024 / 1024).toFixed(1)} Mo`;
}

function escapeHtml(value: string) {
	return value
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#039;');
}
