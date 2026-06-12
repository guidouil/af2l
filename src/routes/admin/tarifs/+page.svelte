<script lang="ts">
	import { untrack } from 'svelte';
	import { calculatePricing } from '$lib/pricing/engine';
	import type {
		PricingBreakdownKey,
		PricingCondition,
		PricingConfig,
		PricingRule
	} from '$lib/pricing/types';

	let { data, form } = $props();

	type EditableRule = PricingRule & {
		amount?: number;
		minimum?: number;
		condition?: PricingCondition;
		key?: PricingBreakdownKey;
		tiers?: { upTo?: number; amount: number }[];
		input?: string;
		optionGroup?: string;
	};

	let config = $state<PricingConfig>(untrack(() => structuredClone(data.config)));
	let serializedConfig = $derived(JSON.stringify(config));
	let preview = $derived(calculatePricing(config, config.defaults));

	const conditions: { value: PricingCondition; label: string }[] = [
		{ value: 'always', label: 'Toujours' },
		{ value: 'wantsCorrection', label: 'Correction cochée' },
		{ value: 'hasFootnotes', label: 'Notes cochées' },
		{ value: 'hasIndex', label: 'Index coché' },
		{ value: 'bookCategory:art-book', label: 'Beau livre' },
		{ value: 'projectType:epub-or-paper-epub', label: 'Projet avec ePub' },
		{ value: 'paperEpubWithCustomCover', label: 'Papier + ePub avec couverture adaptée' },
		{ value: 'complexIndex', label: 'Index complexe' }
	];

	const keys: PricingBreakdownKey[] = [
		'layout',
		'correction',
		'illustrations',
		'tables',
		'footnotes',
		'index',
		'cover',
		'epub',
		'publication',
		'isbn'
	];

	const optionInputs = [
		{ input: 'coverOption', optionGroup: 'coverOptions', label: 'Couvertures' },
		{ input: 'publicationOption', optionGroup: 'publicationOptions', label: 'Publication' },
		{ input: 'isbnOption', optionGroup: 'isbnOptions', label: 'ISBN' }
	] as const;

	function addRule(type: PricingRule['type']) {
		const id = `${type}-${crypto.randomUUID()}`;
		if (type === 'per_estimated_page') {
			config.rules = [
				...config.rules,
				{ id, type, label: 'Nouvelle règle', key: 'layout', amount: 1, minimum: 0 }
			];
		} else if (type === 'per_quantity') {
			config.rules = [
				...config.rules,
				{
					id,
					type,
					label: 'Nouvelle règle',
					key: 'illustrations',
					amount: 1,
					input: 'illustrationCount'
				}
			];
		} else if (type === 'flat_if') {
			config.rules = [
				...config.rules,
				{ id, type, label: 'Nouvelle règle', key: 'footnotes', amount: 0, condition: 'always' }
			];
		} else if (type === 'flat_option_price') {
			config.rules = [
				...config.rules,
				{
					id,
					type,
					label: 'Nouvelle règle',
					key: 'cover',
					input: 'coverOption',
					optionGroup: 'coverOptions'
				}
			];
		} else if (type === 'range_by_pages_if') {
			config.rules = [
				...config.rules,
				{
					id,
					type,
					label: 'Nouvelle règle',
					key: 'index',
					condition: 'hasIndex',
					tiers: [{ upTo: 100, amount: 80 }, { amount: 120 }]
				}
			];
		} else {
			config.rules = [...config.rules, { id, type, label: 'Nouvelle règle', condition: 'always' }];
		}
	}

	function deleteRule(index: number) {
		config.rules = config.rules.filter((_, itemIndex) => itemIndex !== index);
	}

	function addOption(
		group: 'projectTypes' | 'bookCategories' | 'coverOptions' | 'publicationOptions' | 'isbnOptions'
	) {
		const next = [
			...(config[group] as { value: string; label: string; price?: number }[]),
			{ value: `option-${Date.now()}`, label: 'Nouvelle option', price: 0 }
		];
		(config as unknown as Record<typeof group, typeof next>)[group] = next;
	}

	function deleteOption(
		group:
			| 'projectTypes'
			| 'bookCategories'
			| 'coverOptions'
			| 'publicationOptions'
			| 'isbnOptions',
		index: number
	) {
		const next = (config[group] as { value: string; label: string; price?: number }[]).filter(
			(_, itemIndex) => itemIndex !== index
		);
		(config as unknown as Record<typeof group, typeof next>)[group] = next;
	}

	function formatTiers(rule: EditableRule) {
		return (rule.tiers ?? []).map((tier) => `${tier.upTo ?? ''}|${tier.amount}`).join('\n');
	}

	function setTiers(rule: EditableRule, value: string) {
		rule.tiers = value
			.split('\n')
			.map((line) => line.split('|').map((part) => part.trim()))
			.filter((parts) => parts.some(Boolean))
			.map(([upTo, amount]) => ({
				upTo: upTo ? Number(upTo) : undefined,
				amount: Number(amount ?? 0)
			}));
	}
</script>

<svelte:head>
	<title>Tarifs | Administration</title>
</svelte:head>

<section class="admin-page">
	<header class="admin-heading">
		<div>
			<h1>Tarifs</h1>
			<p>Règles typées utilisées par le configurateur public.</p>
		</div>
	</header>

	{#if form?.message}
		<p class="message">{form.message}</p>
	{/if}

	<form method="POST" action="?/save" class="pricing-editor">
		<input type="hidden" name="config" value={serializedConfig} />

		<section class="panel">
			<div class="panel-inner preview">
				<div>
					<h2>Prévisualisation avec les valeurs par défaut</h2>
					<p class="muted">
						{preview.estimatedPages} pages · {preview.requiresQuote
							? 'sur devis'
							: `${preview.total.toFixed(0)} €`}
					</p>
				</div>
				<dl>
					{#each preview.breakdown as item (item.key)}
						<div>
							<dt>{item.label}</dt>
							<dd>{item.amount.toFixed(0)} €</dd>
						</div>
					{/each}
				</dl>
			</div>
		</section>

		<section class="panel panel-inner grid three">
			<label>
				Signes par page estimée
				<input type="number" min="1" bind:value={config.signsPerPage} />
			</label>
			<label>
				Pages par défaut
				<input type="number" min="0" bind:value={config.defaults.pageCount} />
			</label>
			<label>
				Signes par défaut
				<input type="number" min="0" bind:value={config.defaults.signCount} />
			</label>
		</section>

		<section class="panel">
			<div class="panel-inner section-title">
				<h2>Options</h2>
			</div>
			<div class="option-sections">
				{@render OptionEditor('Types de projet', 'projectTypes')}
				{@render OptionEditor('Catégories', 'bookCategories')}
				{@render OptionEditor('Couvertures', 'coverOptions', true)}
				{@render OptionEditor('Publication', 'publicationOptions', true)}
				{@render OptionEditor('ISBN', 'isbnOptions', true)}
			</div>
		</section>

		<section class="panel">
			<div class="panel-inner rules-heading">
				<div>
					<h2>Règles</h2>
					<p class="muted">Ajoute seulement des règles dont le type est connu par le moteur.</p>
				</div>
				<div class="rule-add">
					<button class="secondary" type="button" onclick={() => addRule('per_estimated_page')}
						>Page</button
					>
					<button class="secondary" type="button" onclick={() => addRule('per_quantity')}
						>Quantité</button
					>
					<button class="secondary" type="button" onclick={() => addRule('flat_if')}>Forfait</button
					>
					<button class="secondary" type="button" onclick={() => addRule('flat_option_price')}
						>Option</button
					>
					<button class="secondary" type="button" onclick={() => addRule('range_by_pages_if')}
						>Paliers</button
					>
					<button class="secondary" type="button" onclick={() => addRule('quote_if')}
						>Sur devis</button
					>
				</div>
			</div>

			<div class="rules-list">
				{#each config.rules as rule, index (rule.id)}
					{@const editable = rule as EditableRule}
					<article>
						<header>
							<strong>{rule.type}</strong>
							<button class="danger" type="button" onclick={() => deleteRule(index)}
								>Supprimer</button
							>
						</header>
						<div class="grid three">
							<label>Libellé <input bind:value={rule.label} /></label>
							{#if rule.type !== 'quote_if'}
								<label>
									Clé détail
									<select bind:value={editable.key}>
										{#each keys as key (key)}
											<option value={key}>{key}</option>
										{/each}
									</select>
								</label>
							{/if}
							{#if editable.condition !== undefined}
								<label>
									Condition
									<select bind:value={editable.condition}>
										{#each conditions as condition (condition.value)}
											<option value={condition.value}>{condition.label}</option>
										{/each}
									</select>
								</label>
							{/if}
							{#if editable.amount !== undefined}
								<label
									>Montant <input type="number" step="0.01" bind:value={editable.amount} /></label
								>
							{/if}
							{#if editable.minimum !== undefined}
								<label
									>Minimum <input type="number" step="0.01" bind:value={editable.minimum} /></label
								>
							{/if}
							{#if rule.type === 'per_quantity'}
								<label>
									Champ quantité
									<select bind:value={rule.input}>
										<option value="illustrationCount">Illustrations</option>
										<option value="tableCount">Tableaux</option>
									</select>
								</label>
							{/if}
							{#if rule.type === 'flat_option_price'}
								<label>
									Groupe d’options
									<select bind:value={rule.optionGroup}>
										{#each optionInputs as optionInput (optionInput.optionGroup)}
											<option value={optionInput.optionGroup}>{optionInput.label}</option>
										{/each}
									</select>
								</label>
								<label>
									Champ
									<select bind:value={rule.input}>
										{#each optionInputs as optionInput (optionInput.input)}
											<option value={optionInput.input}>{optionInput.label}</option>
										{/each}
									</select>
								</label>
							{/if}
							{#if rule.type === 'range_by_pages_if'}
								<label class="wide">
									Paliers : jusqu’à|montant, ligne vide pour dernier palier
									<textarea
										value={formatTiers(editable)}
										oninput={(event) => setTiers(editable, event.currentTarget.value)}
									></textarea>
								</label>
							{/if}
						</div>
					</article>
				{/each}
			</div>
		</section>

		<div class="sticky-actions">
			<button type="submit">Enregistrer le brouillon</button>
			<button type="submit" formaction="?/publish" formmethod="POST" class="secondary"
				>Publier</button
			>
		</div>
	</form>
</section>

{#snippet OptionEditor(
	title: string,
	group: 'projectTypes' | 'bookCategories' | 'coverOptions' | 'publicationOptions' | 'isbnOptions',
	withPrice = false
)}
	<section class="option-editor">
		<header>
			<h3>{title}</h3>
			<button class="secondary" type="button" onclick={() => addOption(group)}>Ajouter</button>
		</header>
		{#each config[group] as option, index (option.value)}
			<div class="option-row">
				<input bind:value={option.value} aria-label="Valeur" />
				<input bind:value={option.label} aria-label="Libellé" />
				{#if withPrice}
					<input type="number" step="0.01" bind:value={option.price} aria-label="Prix" />
				{/if}
				<button class="danger" type="button" onclick={() => deleteOption(group, index)}>×</button>
			</div>
		{/each}
	</section>
{/snippet}

<style>
	.pricing-editor {
		display: grid;
		gap: 1rem;
	}

	h2,
	h3 {
		margin: 0;
	}

	.preview {
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(16rem, 24rem);
		gap: 1rem;
	}

	dl {
		display: grid;
		gap: 0.35rem;
		margin: 0;
	}

	dl div {
		display: flex;
		justify-content: space-between;
		gap: 1rem;
	}

	.option-sections {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 1rem;
		padding: 1rem;
	}

	.option-editor {
		display: grid;
		gap: 0.6rem;
	}

	.option-editor header,
	.rules-heading,
	.rules-list article header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
	}

	.option-row {
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(0, 1.4fr) minmax(5rem, 0.5fr) auto;
		gap: 0.45rem;
	}

	.option-row:has(input:nth-child(2):last-of-type) {
		grid-template-columns: minmax(0, 1fr) minmax(0, 1.4fr) auto;
	}

	.section-title,
	.rules-heading {
		border-bottom: 1px solid #ded6c8;
	}

	.rule-add {
		display: flex;
		flex-wrap: wrap;
		gap: 0.45rem;
	}

	.rules-list {
		display: grid;
	}

	.rules-list article {
		display: grid;
		gap: 1rem;
		padding: 1rem;
		border-bottom: 1px solid #ded6c8;
	}

	.rules-list article:last-child {
		border-bottom: 0;
	}

	.wide {
		grid-column: 1 / -1;
	}

	.sticky-actions {
		position: sticky;
		bottom: 0;
		display: flex;
		gap: 0.6rem;
		padding: 0.85rem;
		border: 1px solid #ded6c8;
		border-radius: 8px;
		background: rgba(255, 253, 248, 0.94);
		backdrop-filter: blur(12px);
	}

	@media (max-width: 1050px) {
		.preview,
		.option-sections {
			grid-template-columns: 1fr;
		}
	}

	@media (max-width: 720px) {
		.option-row {
			grid-template-columns: 1fr;
		}
	}
</style>
