// netlify/functions/ingest-pick.js
// Simple JSON store using Netlify Blobs (requires enabling Blobs in your site dashboard)
import { getStore } from '@netlify/blobs';

export default async (request, context) => {
  const url = new URL(request.url);
  const draftId = url.searchParams.get('draftId') || 'demo_draft';
  const method = request.method || 'GET';
  const store = getStore({ name: 'draft-picks' }); // bucket name

  if (method === 'POST') {
    const body = await request.json();
    const pick = { ...body, at: Date.now() };
    const key = `${draftId}.json`;
    const existing = await store.get(key, { type: 'json' }) || { picks: [] };
    existing.picks.push(pick);
    await store.set(key, JSON.stringify(existing), { metadata: { draftId } });
    return new Response(JSON.stringify({ ok: true, saved: pick }), { headers: { 'content-type': 'application/json' } });
  }

  // GET -> return picks
  const data = await store.get(`${draftId}.json`, { type: 'json' }) || { picks: [] };
  return new Response(JSON.stringify(data), { headers: { 'content-type': 'application/json' } });
}
