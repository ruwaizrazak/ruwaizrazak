import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { SITE_TITLE, SITE_DESCRIPTION } from '../consts';

export async function GET(context) {
	// LEARN: Fetch both written collections and merge — the old 'blog' collection
	// never existed, causing the RSS feed to silently return no items
	const [essays, notes] = await Promise.all([
		getCollection('essays'),
		getCollection('notes'),
	]);
	const posts = [...essays, ...notes]
		.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());

	return rss({
		title: SITE_TITLE,
		description: SITE_DESCRIPTION,
		site: context.site,
		items: posts.map((post) => ({
			title: post.data.title,
			description: post.data.description,
			pubDate: post.data.pubDate,
			link: `/${post.collection}/${post.id}/`,
		})),
	});
}
