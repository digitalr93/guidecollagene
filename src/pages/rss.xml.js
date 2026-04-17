import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { SITE_URL, SITE_NAME, SITE_DESCRIPTION } from '../lib/seo';

export async function GET(context) {
  const articles = await getCollection('articles', ({ data }) => !data.draft);
  articles.sort((a, b) => b.data.publishedAt.getTime() - a.data.publishedAt.getTime());

  return rss({
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    site: context.site ?? SITE_URL,
    items: articles.map((article) => ({
      title: article.data.title,
      description: article.data.description,
      pubDate: article.data.publishedAt,
      link: `/guide/${article.id}`,
    })),
    customData: '<language>fr-fr</language>',
  });
}
