// netlify/functions/sleeper.js
import fetch from "node-fetch";

export async function handler(event, context) {
  try {
    const res = await fetch("https://api.sleeper.app/v1/league/YOUR_LEAGUE_ID");
    const data = await res.json();

    // Filter the data down to just what you need
    const filtered = {
      league_id: data.league_id,
      name: data.name,
      total_rosters: data.total_rosters,
      scoring_settings: data.scoring_settings
    };

    return {
      statusCode: 200,
      body: JSON.stringify(filtered),
      headers: { "Content-Type": "application/json" }
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to fetch Sleeper data" })
    };
  }
}
