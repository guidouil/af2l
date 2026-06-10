<script lang="ts">
	let { form } = $props();
</script>

<svelte:head>
	<title>Connexion admin | À fleur de lignes</title>
	<meta name="robots" content="noindex,nofollow" />
</svelte:head>

<main class="login-screen">
	<form method="POST" class="login-panel">
		<div>
			<p>À fleur de lignes</p>
			<h1>Administration</h1>
		</div>

		{#if form?.message}
			<p class="message">{form.message}</p>
		{/if}

		<label>
			Adresse email
			<input name="email" type="email" autocomplete="username" value={form?.email ?? ''} required />
		</label>

		<label>
			Mot de passe
			<input name="password" type="password" autocomplete="current-password" required />
		</label>

		<button type="submit">Se connecter</button>
	</form>
</main>

<style>
	:global(body) {
		overflow: auto;
		background: #25231f;
		color: #1f1d1a;
		font-family:
			Inter,
			ui-sans-serif,
			system-ui,
			-apple-system,
			BlinkMacSystemFont,
			'Segoe UI',
			sans-serif;
	}

	.login-screen {
		min-height: 100dvh;
		display: grid;
		place-items: center;
		padding: 1rem;
	}

	.login-panel {
		width: min(100%, 25rem);
		display: grid;
		gap: 1rem;
		border: 1px solid #ded6c8;
		border-radius: 8px;
		padding: 1.25rem;
		background: #fffdf8;
	}

	p {
		margin: 0;
		color: #70695e;
		text-transform: uppercase;
		font-size: 0.8rem;
	}

	h1 {
		margin: 0.2rem 0 0;
		font-size: 2rem;
	}

	label {
		display: grid;
		gap: 0.35rem;
		font-weight: 700;
	}

	input {
		width: 100%;
		border: 1px solid #d8d0c3;
		border-radius: 6px;
	}

	button {
		min-height: 2.5rem;
		border: 0;
		border-radius: 6px;
		background: #1f1d1a;
		color: #fff;
		font-weight: 700;
	}

	.message {
		border: 1px solid #cdbb8a;
		border-radius: 6px;
		padding: 0.75rem;
		background: #fff8dc;
		color: #4f431b;
		text-transform: none;
	}
</style>
