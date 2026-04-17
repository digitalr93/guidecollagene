import type { APIRoute } from 'astro';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const payload = await request.json();

    const {
      clickId,
      productId,
      merchant,
      destinationUrl,
      sourcePage,
      referrer,
      device,
      timestamp,
    } = payload;

    // Validate required fields
    if (!clickId || !productId || !merchant) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Insert into Supabase (requires SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY env vars)
    const supabaseUrl = import.meta.env.SUPABASE_URL;
    const supabaseKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

    if (supabaseUrl && supabaseKey) {
      const res = await fetch(`${supabaseUrl}/rest/v1/clicks`, {
        method: 'POST',
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          Prefer: 'return=minimal',
        },
        body: JSON.stringify({
          click_id: clickId,
          product_id: productId,
          merchant,
          destination_url: destinationUrl,
          source_page: sourcePage,
          referrer: referrer ?? null,
          device: device ?? 'unknown',
          clicked_at: timestamp ?? new Date().toISOString(),
        }),
      });

      if (!res.ok) {
        console.error('[click] Supabase error:', await res.text());
      }
    }

    return new Response(null, { status: 204 });
  } catch (err) {
    console.error('[click] Error:', err);
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
