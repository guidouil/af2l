<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';

	let { data, children } = $props();

	const navItems = [
		{ href: '/admin', label: 'Tableau de bord' },
		{ href: '/admin/pages', label: 'Pages' },
		{ href: '/admin/tarifs', label: 'Tarifs' },
		{ href: '/admin/media', label: 'Médias' },
		{ href: '/admin/settings', label: 'Paramètres' }
	];
</script>

<svelte:head>
	<meta name="robots" content="noindex,nofollow" />
</svelte:head>

{#if page.url.pathname === '/admin/login'}
	{@render children()}
{:else}
	<div class="admin-shell">
		<aside class="admin-sidebar">
			<a class="admin-brand" href={resolve('/admin')}>
				<span>À fleur de lignes</span>
				<strong>Administration</strong>
			</a>

			<nav aria-label="Navigation admin">
				{#each navItems as item (item.href)}
					<a
						href={resolve(item.href)}
						aria-current={page.url.pathname === item.href ? 'page' : undefined}
					>
						{item.label}
					</a>
				{/each}
			</nav>

			<div class="admin-account">
				<span>{data.adminUser?.email}</span>
				<form method="POST" action="/admin/logout">
					<button type="submit">Déconnexion</button>
				</form>
			</div>
		</aside>

		<main class="admin-main">
			{@render children()}
		</main>
	</div>
{/if}

<style>
	:global(body) {
		overflow: auto;
		background: #f5f2ec;
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

	:global(.admin-page) {
		display: grid;
		gap: 1.25rem;
	}

	:global(.admin-heading) {
		display: flex;
		align-items: end;
		justify-content: space-between;
		gap: 1rem;
	}

	:global(.admin-heading h1) {
		margin: 0;
		font-size: clamp(1.7rem, 4vw, 2.6rem);
		line-height: 1;
		font-weight: 700;
	}

	:global(.admin-heading p),
	:global(.muted) {
		margin: 0.35rem 0 0;
		color: #70695e;
	}

	:global(.panel) {
		border: 1px solid #ded6c8;
		border-radius: 8px;
		background: #fffdf8;
		box-shadow: 0 1px 0 rgba(28, 22, 13, 0.04);
	}

	:global(.panel-inner) {
		padding: 1rem;
	}

	:global(.grid) {
		display: grid;
		gap: 1rem;
	}

	:global(.grid.two) {
		grid-template-columns: repeat(2, minmax(0, 1fr));
	}

	:global(.grid.three) {
		grid-template-columns: repeat(3, minmax(0, 1fr));
	}

	:global(label) {
		display: grid;
		gap: 0.35rem;
		font-weight: 650;
	}

	:global(input),
	:global(textarea),
	:global(select) {
		width: 100%;
		border: 1px solid #d8d0c3;
		border-radius: 6px;
		background: #fff;
		color: #1f1d1a;
	}

	:global(textarea) {
		min-height: 8rem;
		resize: vertical;
	}

	:global(button),
	:global(.button) {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-height: 2.35rem;
		border: 1px solid #1f1d1a;
		border-radius: 6px;
		padding: 0.45rem 0.75rem;
		background: #1f1d1a;
		color: #fff;
		text-decoration: none;
		font-weight: 700;
		cursor: pointer;
	}

	:global(button.secondary),
	:global(.button.secondary) {
		border-color: #d8d0c3;
		background: #fffdf8;
		color: #1f1d1a;
	}

	:global(button.danger) {
		border-color: #922f35;
		background: #922f35;
	}

	:global(.message) {
		border: 1px solid #cdbb8a;
		border-radius: 6px;
		padding: 0.75rem;
		background: #fff8dc;
		color: #4f431b;
	}

	.admin-shell {
		min-height: 100dvh;
		display: grid;
		grid-template-columns: 17rem minmax(0, 1fr);
	}

	.admin-sidebar {
		position: sticky;
		top: 0;
		height: 100dvh;
		display: grid;
		grid-template-rows: auto 1fr auto;
		gap: 1.25rem;
		padding: 1rem;
		border-right: 1px solid #ded6c8;
		background: #25231f;
		color: #f8f3e7;
	}

	.admin-brand {
		display: grid;
		gap: 0.2rem;
		color: inherit;
		text-decoration: none;
	}

	.admin-brand span {
		color: #cfc6b4;
		font-size: 0.78rem;
		text-transform: uppercase;
	}

	.admin-brand strong {
		font-size: 1.2rem;
	}

	.admin-sidebar nav {
		display: grid;
		align-content: start;
		gap: 0.35rem;
	}

	.admin-sidebar nav a {
		border-radius: 6px;
		padding: 0.7rem 0.75rem;
		color: #f8f3e7;
		text-decoration: none;
	}

	.admin-sidebar nav a[aria-current='page'],
	.admin-sidebar nav a:hover {
		background: #3c3932;
	}

	.admin-account {
		display: grid;
		gap: 0.65rem;
		color: #cfc6b4;
		font-size: 0.85rem;
		overflow-wrap: anywhere;
	}

	.admin-account button {
		width: 100%;
		border-color: #5b5549;
		background: transparent;
	}

	.admin-main {
		min-width: 0;
		padding: clamp(1rem, 3vw, 2rem);
	}

	@media (max-width: 880px) {
		.admin-shell {
			grid-template-columns: 1fr;
		}

		.admin-sidebar {
			position: static;
			height: auto;
			grid-template-rows: auto auto auto;
		}

		.admin-sidebar nav {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}

		:global(.grid.two),
		:global(.grid.three) {
			grid-template-columns: 1fr;
		}
	}
</style>
