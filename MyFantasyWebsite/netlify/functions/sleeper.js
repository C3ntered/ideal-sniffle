// This function fetches the large player list AND the ADP rankings from Sleeper,
// merges them, filters the data, and returns a smaller, faster payload.
// File location: netlify/functions/sleeper.js

exports.handler = async function (event) {
  // Only allow GET requests for this function
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const SLEEPER_PLAYERS_URL = 'https://api.sleeper.app/v1/players/nfl';
  const SLEEPER_ADP_URL = 'https://api.sleeper.app/v1/draft/nfl/adp';

  try {
    const [playersResponse, adpResponse] = await Promise.all([
      fetch(SLEEPER_PLAYERS_URL),
      fetch(SLEEPER_ADP_URL)
    ]);

    if (!playersResponse.ok || !adpResponse.ok) {
      throw new Error(`Sleeper API request failed. Players: ${playersResponse.status}, ADP: ${adpResponse.status}`);
    }
    
    const allPlayers = await playersResponse.json();
    const adpData = await adpResponse.json();

    // Correctly merge the data by iterating over the keys (player IDs) of the ADP object
    const mergedAndFilteredPlayers = Object.keys(adpData)
      .map(playerId => {
        const adpInfo = adpData[playerId];
        const playerDetails = allPlayers[playerId];

        if (!playerDetails || !adpInfo) {
          return null;
        }
        
        // Combine the data from both sources
        return {
          player_id: playerId,
          full_name: playerDetails.full_name || `${playerDetails.first_name} ${playerDetails.last_name}`,
          position: playerDetails.position,
          team: playerDetails.team || 'FA',
          active: playerDetails.active,
          adp: parseFloat(adpInfo.adp) || 999,
          adp_ppr: parseFloat(adpInfo.adp_ppr) || 999
        };
      })
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
      body: JSON.stringify({ error: "Failed to fetch or process player data from Sleeper" })
    };
  }
};
