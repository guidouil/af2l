<script lang="ts">
	import { resolve } from '$app/paths';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	type ProjectSubmission = PageProps['data']['submissions'][number];

	let pendingDelete = $state<ProjectSubmission | null>(null);

	const dateFormatter = new Intl.DateTimeFormat('fr-FR', {
		dateStyle: 'medium',
		timeStyle: 'short'
	});

	function formatDate(value: Date | string) {
		return dateFormatter.format(new Date(value));
	}

	function formatFileSize(bytes: number) {
		if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} Ko`;
		return `${(bytes / 1024 / 1024).toFixed(1)} Mo`;
	}

	function statusLabel(value: string) {
		return data.statuses.find((status) => status.value === value)?.label ?? value;
	}

	function closeDeleteDialog() {
		pendingDelete = null;
	}
</script>

<svelte:window
	onkeydown={(event) => {
		if (event.key === 'Escape') closeDeleteDialog();
	}}
/>

<svelte:head>
	<title>Projets soumis | Administration</title>
</svelte:head>

<section class="admin-page">
	<header class="admin-heading">
		<div>
			<h1>Projets soumis</h1>
			<p>Dossiers envoyés depuis la page de dépôt de projet.</p>
		</div>
	</header>

	{#if form?.message}
		<p class="message">{form.message}</p>
	{/if}

	{#if data.submissions.length === 0}
		<section class="panel panel-inner empty-state">
			<h2>Aucun projet soumis</h2>
			<p class="muted">Les prochains dépôts apparaîtront ici avec leurs fichiers.</p>
		</section>
	{:else}
		<div class="project-list">
			{#each data.submissions as submission (submission.id)}
				<details class="panel project-card">
					<summary class="project-summary">
						<div>
							<h2>{submission.fullName}</h2>
							<span>{submission.files.length} fichier{submission.files.length > 1 ? 's' : ''}</span>
						</div>
						<strong>{statusLabel(submission.status)}</strong>
					</summary>

					<div class="project-details">
						<div class="panel-inner project-header">
							<div>
								<p class="submitted-at">{formatDate(submission.createdAt)}</p>
								<a href={`mailto:${submission.email}`}>{submission.email}</a>
							</div>

							<form method="POST" action="?/updateStatus" class="status-form">
								<input type="hidden" name="id" value={submission.id} />
								<label>
									Statut
									<select
										name="status"
										onchange={(event) => event.currentTarget.form?.requestSubmit()}
									>
										{#each data.statuses as status (status.value)}
											<option value={status.value} selected={submission.status === status.value}>
												{status.label}
											</option>
										{/each}
									</select>
								</label>
							</form>
						</div>

						{#if submission.message}
							<div class="project-message">
								<h3>Message</h3>
								<p>{submission.message}</p>
							</div>
						{/if}

						<div class="project-files">
							<h3>Fichiers</h3>
							<ul>
								{#each submission.files as file (file.id)}
									<li>
										<div>
											<strong>{file.originalName}</strong>
											<span>{file.mimeType} · {formatFileSize(file.byteSize)}</span>
										</div>
										<a class="button secondary" href={resolve(`/admin/projects/files/${file.id}`)}>
											Télécharger
										</a>
									</li>
								{/each}
							</ul>
						</div>

						<div class="delete-form">
							<button class="danger" type="button" onclick={() => (pendingDelete = submission)}>
								Supprimer
							</button>
						</div>
					</div>
				</details>
			{/each}
		</div>
	{/if}
</section>

{#if pendingDelete}
	<div class="dialog-layer" role="presentation">
		<button
			class="dialog-backdrop"
			type="button"
			aria-label="Annuler la suppression"
			onclick={closeDeleteDialog}
		></button>

		<div
			class="delete-dialog"
			role="dialog"
			aria-modal="true"
			aria-labelledby="delete-dialog-title"
			aria-describedby="delete-dialog-description"
		>
			<div class="dialog-icon" aria-hidden="true">!</div>
			<div class="dialog-content">
				<p class="dialog-kicker">Suppression définitive</p>
				<h2 id="delete-dialog-title">Supprimer le projet de {pendingDelete.fullName} ?</h2>
				<p id="delete-dialog-description">
					Le projet soumis, les informations de contact et tous les fichiers associés seront
					supprimés. Cette action ne peut pas être annulée.
				</p>
			</div>

			<div class="dialog-actions">
				<button class="secondary" type="button" onclick={closeDeleteDialog}>Annuler</button>
				<form method="POST" action="?/delete">
					<input type="hidden" name="id" value={pendingDelete.id} />
					<button class="danger" type="submit">Supprimer définitivement</button>
				</form>
			</div>
		</div>
	</div>
{/if}

<style>
	h2,
	h3,
	p {
		margin-top: 0;
	}

	h2 {
		margin-bottom: 0.35rem;
		font-size: 1.25rem;
		line-height: 1.2;
	}

	h3 {
		margin-bottom: 0.6rem;
		font-size: 0.82rem;
		color: #70695e;
		text-transform: uppercase;
	}

	.empty-state {
		display: grid;
		gap: 0.35rem;
	}

	.project-list {
		display: grid;
		gap: 1rem;
	}

	.project-card {
		overflow: hidden;
	}

	.project-summary {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto auto;
		gap: 1rem;
		align-items: center;
		padding: 1rem;
		cursor: pointer;
		list-style: none;
	}

	.project-summary::-webkit-details-marker {
		display: none;
	}

	.project-summary::after {
		content: '';
		width: 0.55rem;
		height: 0.55rem;
		border-right: 2px solid #70695e;
		border-bottom: 2px solid #70695e;
		transform: rotate(45deg);
		transition: transform 160ms ease;
	}

	.project-card[open] .project-summary::after {
		transform: rotate(225deg);
	}

	.project-summary:hover {
		background: #f8f3e7;
	}

	.project-summary h2,
	.project-summary span,
	.project-summary strong {
		margin: 0;
	}

	.project-summary span {
		color: #70695e;
		font-size: 0.88rem;
	}

	.project-summary strong {
		border: 1px solid #d8d0c3;
		border-radius: 999px;
		padding: 0.32rem 0.58rem;
		background: #fff;
		color: #405c47;
		font-size: 0.82rem;
		white-space: nowrap;
	}

	.project-details {
		border-top: 1px solid #ded6c8;
	}

	.project-header {
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(12rem, 16rem);
		gap: 1rem;
		align-items: start;
		border-bottom: 1px solid #ded6c8;
	}

	.submitted-at {
		margin-bottom: 0.35rem;
		color: #70695e;
		font-size: 0.86rem;
	}

	.project-header a {
		color: #405c47;
		overflow-wrap: anywhere;
	}

	.status-form label {
		font-size: 0.82rem;
		color: #70695e;
		text-transform: uppercase;
	}

	.project-message,
	.project-files,
	.delete-form {
		padding: 1rem;
		border-bottom: 1px solid #ded6c8;
	}

	.project-message p {
		margin-bottom: 0;
		color: #38342e;
		line-height: 1.55;
		white-space: pre-wrap;
	}

	.project-files ul {
		display: grid;
		gap: 0.65rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.project-files li {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto;
		gap: 0.75rem;
		align-items: center;
		border: 1px solid #e7dfd2;
		border-radius: 6px;
		padding: 0.7rem;
		background: #fff;
	}

	.project-files strong,
	.project-files span {
		display: block;
		overflow-wrap: anywhere;
	}

	.project-files span {
		margin-top: 0.18rem;
		color: #70695e;
		font-size: 0.86rem;
	}

	.delete-form {
		display: flex;
		justify-content: flex-end;
		border-bottom: 0;
	}

	.dialog-layer {
		position: fixed;
		inset: 0;
		z-index: 50;
		display: grid;
		place-items: center;
		padding: 1rem;
	}

	.dialog-backdrop {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		border: 0;
		border-radius: 0;
		padding: 0;
		background: rgba(31, 29, 26, 0.52);
		backdrop-filter: blur(5px);
	}

	.delete-dialog {
		position: relative;
		z-index: 1;
		width: min(100%, 34rem);
		display: grid;
		grid-template-columns: auto minmax(0, 1fr);
		gap: 1rem;
		border: 1px solid #d7a2a6;
		border-radius: 8px;
		padding: 1.1rem;
		background: #fffdf8;
		box-shadow: 0 1.5rem 4rem rgba(31, 29, 26, 0.28);
	}

	.dialog-icon {
		width: 2.65rem;
		aspect-ratio: 1;
		display: grid;
		place-items: center;
		border-radius: 999px;
		background: #922f35;
		color: #fff;
		font-weight: 800;
	}

	.dialog-content {
		display: grid;
		gap: 0.45rem;
	}

	.dialog-kicker {
		margin-bottom: 0;
		color: #922f35;
		font-size: 0.78rem;
		font-weight: 800;
		text-transform: uppercase;
	}

	.delete-dialog h2 {
		margin-bottom: 0;
	}

	.delete-dialog p:not(.dialog-kicker) {
		margin-bottom: 0;
		color: #70695e;
		line-height: 1.5;
	}

	.dialog-actions {
		grid-column: 1 / -1;
		display: flex;
		flex-wrap: wrap;
		justify-content: flex-end;
		gap: 0.65rem;
		padding-top: 0.35rem;
	}

	.dialog-actions form {
		display: contents;
	}

	@media (max-width: 720px) {
		.project-summary,
		.project-header,
		.project-files li {
			grid-template-columns: 1fr;
		}

		.project-files .button {
			width: 100%;
		}

		.delete-dialog {
			grid-template-columns: 1fr;
		}

		.dialog-actions,
		.dialog-actions button {
			width: 100%;
		}
	}
</style>
