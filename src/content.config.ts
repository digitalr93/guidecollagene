import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const articles = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/articles' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    publishedAt: z.coerce.date(),
    updatedAt: z.coerce.date().optional(),
    author: z.string(),
    category: z.string(),
    tags: z.array(z.string()).default([]),
    image: z.string().optional(),
    imageAlt: z.string().optional(),
    draft: z.boolean().default(false),
    featured: z.boolean().default(false),
    faq: z
      .array(
        z.object({
          question: z.string(),
          answer: z.string(),
        })
      )
      .optional(),
    featuredProducts: z.array(z.string()).optional(),
    keyPoints: z.array(z.string()).optional(),
  }),
});

const produits = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/produits' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    brand: z.string(),
    category: z.enum(['marin', 'bovin', 'vegetal', 'peptides', 'autre']),
    image: z.string().optional(),
    imageAlt: z.string().optional(),

    // Affiliation
    merchant: z.string(),
    affiliateUrl: z.string().url(),
    price: z.number().optional(),
    currency: z.string().default('EUR'),

    // Promo
    promoCode: z.string().optional(),
    promoDiscount: z.number().optional(), // pourcentage, ex: 5 = -5%

    // Évaluation
    rating: z.number().min(0).max(5),
    reviewCount: z.number().default(0),
    pros: z.array(z.string()).default([]),
    cons: z.array(z.string()).default([]),

    // Composition
    collagenType: z.array(z.string()).optional(),
    dosage: z.string().optional(),
    format: z.enum(['poudre', 'gelules', 'liquide', 'comprime', 'gummies']).optional(),
    certifications: z.array(z.string()).default([]),

    publishedAt: z.coerce.date(),
    updatedAt: z.coerce.date().optional(),
    draft: z.boolean().default(false),
    featured: z.boolean().default(false),
  }),
});

const auteurs = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/auteurs' }),
  schema: z.object({
    name: z.string(),
    role: z.string(),
    bio: z.string(),
    avatar: z.string().optional(),
    credentials: z.array(z.string()).default([]),
    linkedin: z.string().url().optional(),
    twitter: z.string().optional(),
  }),
});

export const collections = { articles, produits, auteurs };
