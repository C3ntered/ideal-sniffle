exports.handler = async function(event) {
  const { getStore } = await import('@netlify/blobs');
  const url = new URL(event.rawUrl);
  const draftId = (url.searchParams.get('draftId') || 'demo_draft').trim();
  const store = getStore({ name: 'draft-picks' });

  if (event.httpMethod === 'POST') {
    const body = JSON.parse(event.body || '{}');
    const key = `${draftId}.json`;
    const existing = (await store.get(key, { type: 'json' })) || { picks: [] };
    existing.picks.push({ ...body, at: Date.now() });
    await store.set(key, JSON.stringify(existing));
    return { statusCode: 200, headers: { 'content-type':'application/json' }, body: JSON.stringify({ ok:true }) };
  }

  const data = (await store.get(`${draftId}.json`, { type: 'json' })) || { picks: [] };
  return { statusCode: 200, headers: { 'content-type':'application/json' }, body: JSON.stringify(data) };
};
