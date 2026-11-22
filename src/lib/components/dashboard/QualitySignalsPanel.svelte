<script lang="ts">
	import Icon from '$lib/components/ui/Icon.svelte';
	import type { QualitySignal } from '$lib/types/sourcing';

	interface Props {
		signals: QualitySignal[];
	}

	let { signals }: Props = $props();
</script>

<article class="panel quality-panel">
	<div class="panel-heading">
		<div>
			<h2>Data quality signals</h2>
			<p>Patterns across the recommendations</p>
		</div>
		<Icon name="shield-alert" size={17} color="var(--primary)" />
	</div>

	{#each signals as signal (signal.id)}
		<div class="quality-row">
			<span class="quality-marker" class:high={signal.severity === 'HIGH'}></span>
			<div>
				<b>{signal.title}</b>
				<small>{signal.detail}</small>
			</div>
			<span class="quality-label">{signal.severity}</span>
		</div>
	{/each}
</article>
