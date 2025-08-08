// This function fetches the large player list from Sleeper,
// filters it down to only the necessary data, and returns a smaller, faster payload.
// File location: netlify/functions/sleeper.js

exports.handler = async function (event) {
  // Only allow GET requests for this function
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const SLEEPER_API_URL = 'https://api.sleeper.app/v1/players/nfl';

  try {
    const response = await fetch(SLEEPER_API_URL);
    if (!response.ok) {
      throw new Error(`Sleeper API request failed with status ${response.status}`);
    }
    const players = await response.json();

    // Convert the large player object into a smaller, filtered array
    const filteredPlayers = Object.values(players)
      .filter(p => p.active && p.position && ['QB', 'RB', 'WR', 'TE', 'DL', 'LB', 'DB'].includes(p.position))
      .map(p => ({
        player_id: p.player_id,
        full_name: p.full_name || `${p.first_name} ${p.last_name}`,
        position: p.position,
        team: p.team || 'FA',
        adp: p.fantasy_data?.adp || 999,
        adp_ppr: p.fantasy_data?.adp_ppr || 999
      }));

    return {
      statusCode: 200,
      body: JSON.stringify(filteredPlayers),
      headers: { "Content-Type": "application/json" }
    };

  } catch (error) {
    console.error("Error in sleeper function:", error);
    return { 
      statusCode: 500, 
      body: JSON.stringify({ error: "Failed to fetch player data from Sleeper" })
    };
  }
};
