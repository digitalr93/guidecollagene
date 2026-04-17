import type { APIRoute } from 'astro';

export const prerender = false;

/**
 * POST /api/conversion
 * Receives postback from affiliate networks after a confirmed sale.
 * Expected payload (varies by network — adapt per programme):
 * {
 *   clickId: string       // Our click_id we passed as subid
 *   orderId: string       // Network order ID
 *   amount: number        // Sale amount (EUR)
 *   commission: number    // Commission earned
 *   merchant: string
 *   status: 'confirmed' | 'pending' | 'rejected'
 * }
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    const payload = await request.json();

    const { clickId, orderId, amount, commission, merchant, status } = payload;

    if (!clickId || !orderId) {
      return new Response(JSON.stringify({ error: 'Missing clickId or orderId' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = import.meta.env.SUPABASE_URL;
    const supabaseKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

    if (supabaseUrl && supabaseKey) {
      const res = await fetch(`${supabaseUrl}/rest/v1/conversions`, {
        method: 'POST',
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          Prefer: 'return=minimal',
        },
        body: JSON.stringify({
          click_id: clickId,
          order_id: orderId,
          amount: amount ?? 0,
          commission: commission ?? 0,
          merchant: merchant ?? null,
          status: status ?? 'pending',
          converted_at: new Date().toISOString(),
        }),
      });

      if (!res.ok) {
        console.error('[conversion] Supabase error:', await res.text());
        return new Response(JSON.stringify({ error: 'DB error' }), { status: 500 });
      }
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[conversion] Error:', err);
    return new Response(JSON.stringify({ error: 'Internal error' }), { status: 500 });
  }
};
