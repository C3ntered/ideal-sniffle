// This function fetches the large player list AND the ADP rankings from Sleeper,
// merges them, filters the data, and returns a smaller, faster payload.
// File location: netlify/functions/sleeper.js

exports.handler = async function (event) {
  // Only allow GET requests for this function
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  // We need two URLs: one for all player details and one for ADP data
  const SLEEPER_PLAYERS_URL = 'https://api.sleeper.app/v1/players/nfl';
  const SLEEPER_ADP_URL = 'https://api.sleeper.app/v1/draft/nfl/adp';

  try {
    // Fetch both endpoints at the same time for efficiency
    const [playersResponse, adpResponse] = await Promise.all([
      fetch(SLEEPER_PLAYERS_URL),
      fetch(SLEEPER_ADP_URL)
    ]);

    if (!playersResponse.ok) {
      throw new Error(`Sleeper Players API request failed with status ${playersResponse.status}`);
    }
    if (!adpResponse.ok) {
        throw new Error(`Sleeper ADP API request failed with status ${adpResponse.status}`);
    }
    
    const allPlayers = await playersResponse.json(); // This is a large object keyed by player_id
    const adpData = await adpResponse.json(); // This is an array of players with ADP ranks

    // Merge the ADP data with the main player list
    const mergedAndFilteredPlayers = Object.values(adpData)
      .map(adpPlayer => {
        const playerDetails = allPlayers[adpPlayer.player_id];

        // If player details don't exist for some reason, skip them
        if (!playerDetails) {
          return null;
        }
        
        // Combine the data from both sources
        return {
          player_id: adpPlayer.player_id,
          full_name: playerDetails.full_name || `${playerDetails.first_name} ${playerDetails.last_name}`,
          position: playerDetails.position,
          team: playerDetails.team || 'FA',
          active: playerDetails.active,
          adp: parseFloat(adpPlayer.adp) || 999,
          adp_ppr: parseFloat(adpPlayer.adp_ppr) || 999
        };
      })
      // Now filter the merged list to get only the players we want
      .filter(p => p && p.active && p.position && ['QB', 'RB', 'WR', 'TE', 'DL', 'LB', 'DB'].includes(p.position));

    return {
      statusCode: 200,
      body: JSON.stringify(mergedAndFilteredPlayers),
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
