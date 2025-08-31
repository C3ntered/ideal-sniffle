// netlify/functions/ingest-pick.js

// In-memory store for demo (resets when functions cold-start).
// For real persistence, hook into Netlify KV, Supabase, or a DB.
let picksByDraft = {};

exports.handler = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400',
      },
      body: '',
    };
  }

  // POST /ingest-pick  → record a pick
  if (event.httpMethod === 'POST') {
    try {
      const data = JSON.parse(event.body || '{}');
      const { draftId, playerName, pickNumber, userId, timestamp } = data;

      if (!draftId || !playerName) {
        return { statusCode: 400, body: 'draftId and playerName required' };
      }

      if (!picksByDraft[draftId]) {
        picksByDraft[draftId] = [];
      }
      picksByDraft[draftId].push({ playerName, pickNumber, userId, timestamp });

      return {
        statusCode: 200,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ ok: true }),
      };
    } catch (err) {
      return { statusCode: 400, body: `Invalid JSON: ${err.message}` };
    }
  }

  // GET /ingest-pick?draftId=abc123  → fetch picks for a draft
  if (event.httpMethod === 'GET') {
    const draftId = event.queryStringParameters.draftId;
    if (!draftId) {
      return { statusCode: 400, body: 'draftId required' };
    }
    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(picksByDraft[draftId] || []),
    };
  }

  return { statusCode: 405, body: 'Method Not Allowed' };
};
