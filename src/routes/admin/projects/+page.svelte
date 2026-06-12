<script lang="ts">
	import { resolve } from '$app/paths';

	let { data, form } = $props();

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
</script>

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
				<article class="panel project-card">
					<div class="panel-inner project-header">
						<div>
							<p class="submitted-at">{formatDate(submission.createdAt)}</p>
							<h2>{submission.fullName}</h2>
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

					<form method="POST" action="?/delete" class="delete-form">
						<input type="hidden" name="id" value={submission.id} />
						<button class="danger" type="submit">Supprimer</button>
					</form>
				</article>
			{/each}
		</div>
	{/if}
</section>

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
		display: grid;
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

	@media (max-width: 720px) {
		.project-header,
		.project-files li {
			grid-template-columns: 1fr;
		}

		.project-files .button {
			width: 100%;
		}
	}
</style>
