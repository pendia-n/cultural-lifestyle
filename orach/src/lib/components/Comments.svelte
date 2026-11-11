<script lang="ts">
	import { api } from '#lib/client';
	import { onMount } from 'svelte';
	import Icon from './Icon.svelte';
	let {
		city,
		section,
		user
	}: { city: string; section: string; user: { username: string } | null } = $props();
	type Comment = {
		id: string;
		body: string;
		username: string;
		likes: number;
		liked: number;
		created_at: string;
	};
	let comments = $state<Comment[]>([]),
		body = $state(''),
		message = $state(''),
		busy = $state(false),
		loaded = $state(false);
	async function load() {
		try {
			const r = await api(`comments?city=${city}&section=${section}`);
			comments = r.comments;
			loaded = true;
		} catch (e) {
			message = (e as Error).message;
		}
	}
	$effect(() => {
		const key = city + section;
		void key;
		comments = [];
		loaded = false;
		message = '';
		void load();
	});
	async function post() {
		busy = true;
		message = '';
		try {
			await api('comments', { city, section, body });
			body = '';
			await load();
		} catch (e) {
			message = (e as Error).message;
		} finally {
			busy = false;
		}
	}
	async function like(id: string) {
		try {
			await api('comments/like', { id });
			await load();
		} catch (e) {
			message = (e as Error).message;
		}
	}
	async function report(id: string) {
		try {
			await api('comments/report', { id });
			message = 'Reported for review. Thank you.';
		} catch (e) {
			message = (e as Error).message;
		}
	}
</script>

<section class="community">
	<div class="row">
		<div>
			<p class="eyebrow">From people who go there</p>
			<h3>Community fieldnotes</h3>
		</div>
		<span class="badge">Always free</span>
	</div>
	<p class="small-text muted intro">
		Share a useful discovery, what you paid, or something you wish you’d known. Five unique likes
		turn a note into a community info card, shown first in this section. Votes do not verify a
		claim.
	</p>
	{#if loaded && !comments.length}<p class="no-notes">
			No notes in this section yet. You can write the first.
		</p>{/if}
	{#each comments as comment}<article class:highlight={comment.likes >= 5}>
			{#if comment.likes >= 5}<span class="badge"
					><Icon name="spark" size={12} /> Community highlight</span
				>{/if}
			<div class="row comment-meta">
				<strong>{comment.username}</strong><time>{comment.created_at.slice(0, 10)}</time>
			</div>
			<p class="body">{comment.body}</p>
			<div class="row">
				<button
					class="like"
					class:liked={comment.liked}
					onclick={() => like(comment.id)}
					disabled={!user || comment.username === user.username}
					aria-label={'Like comment by ' + comment.username}
					><Icon name="heart" size={15} />{comment.likes}
					{comment.likes === 1 ? 'like' : 'likes'}</button
				><button class="report" onclick={() => report(comment.id)} disabled={!user}>Report</button>
			</div>
		</article>{/each}
	{#if user}<form
			onsubmit={(e) => {
				e.preventDefault();
				void post();
			}}
		>
			<label class="label" for="comment">Add a comment or useful detail</label><textarea
				id="comment"
				bind:value={body}
				minlength="10"
				maxlength="1200"
				required
				placeholder="What should someone know before they go? Include your visit date and any relevant conditions."
			></textarea>
			<div class="row">
				<small class="muted">{body.length}/1,200 · No personal or sensitive information</small
				><button class="button small" disabled={busy}>{busy ? 'Posting…' : 'Post for free'}</button>
			</div>
		</form>{:else}<a class="text-link" href="/sign-up"
			>Create a free account to join in<Icon name="arrow" size={15} /></a
		>{/if}
	{#if message}<p role="status" class="notice info">{message}</p>{/if}
</section>

<style>
	.community {
		margin-top: 32px;
		border-top: 1px solid var(--line);
		padding-top: 30px;
	}
	.community h3 {
		margin-top: 10px;
	}
	.intro {
		margin: 15px 0 20px;
		max-width: 650px;
	}
	.no-notes {
		font-size: 13px;
		color: var(--muted);
		padding: 20px 0 25px;
	}
	article {
		border: 1px solid var(--line);
		padding: 20px;
		border-radius: 10px;
		margin-bottom: 12px;
		background: white;
	}
	article.highlight {
		background: #f2f3e1;
		border-color: #d5dcb3;
	}
	.comment-meta {
		font-size: 11px;
		margin: 12px 0;
	}
	.comment-meta time {
		color: var(--muted);
	}
	.body {
		font-size: 14px;
		white-space: pre-wrap;
		overflow-wrap: anywhere;
		margin-bottom: 18px;
	}
	.like {
		display: flex;
		align-items: center;
		gap: 7px;
		background: transparent;
		font-size: 12px;
		color: var(--muted);
	}
	.like.liked {
		color: #b3654b;
	}
	.report {
		background: none;
		color: var(--muted);
		font-size: 11px;
	}
	form {
		margin: 24px 0;
	}
	textarea {
		display: block;
		width: 100%;
		min-height: 100px;
		border: 1px solid var(--line);
		border-radius: 8px;
		background: white;
		padding: 13px;
		margin: 10px 0;
		font-size: 13px;
	}
	form small {
		font-size: 10px;
	}
	.notice {
		margin-top: 15px;
	}
</style>
