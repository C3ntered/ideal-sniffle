// This function fetches player data and handles cases where the primary ADP source may be offline.
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

    // The main player list is critical. If it fails, we cannot proceed.
    if (!playersResponse.ok) {
      throw new Error(`Critical Error: The main Sleeper Players API failed with status ${playersResponse.status}`);
    }
    
    const allPlayers = await playersResponse.json();
    let processedPlayers;

    // PRIMARY PATH: The preferred ADP endpoint is working.
    if (adpResponse.ok) {
      console.log("ADP data found. Using primary ranking source.");
      const adpData = await adpResponse.json();
      processedPlayers = Object.keys(adpData).map(playerId => {
        const adpInfo = adpData[playerId];
        const playerDetails = allPlayers[playerId];
        if (!playerDetails) return null;
        
        return {
          player_id: playerId,
          full_name: playerDetails.full_name || `${playerDetails.first_name} ${playerDetails.last_name}`,
          position: playerDetails.position,
          team: playerDetails.team || 'FA',
          active: playerDetails.active,
          adp: parseFloat(adpInfo.adp) || 999,
          adp_ppr: parseFloat(adpInfo.adp_ppr) || 999
        };
      });
    } else {
      // FALLBACK PATH: The ADP endpoint is down (e.g., 404 error).
      // We will use the main player list and look for a different ranking metric, like Expert Consensus Rank (ECR).
      console.warn(`ADP endpoint failed with status ${adpResponse.status}. Using fallback ECR rankings.`);
      processedPlayers = Object.values(allPlayers).map(p => ({
        player_id: p.player_id,
        full_name: p.full_name || `${p.first_name} ${p.last_name}`,
        position: p.position,
        team: p.team || 'FA',
        active: p.active,
        // Use Expert Consensus Rank (rank_ecr) as the fallback, defaulting to 999 if that's also missing.
        adp: p.fantasy_data?.rank_ecr || 999,
        adp_ppr: p.fantasy_data?.rank_ecr || 999
      }));
    }

    // Filter the final list for active players in the positions we care about.
    const finalPlayers = processedPlayers.filter(p => p && p.active && p.position && ['QB', 'RB', 'WR', 'TE', 'K', 'DEF', 'DL', 'LB', 'DB'].includes(p.position));

    return {
      statusCode: 200,
      body: JSON.stringify(finalPlayers),
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
