// This is your new serverless function to fetch data from ESPN's unofficial API.
// File location: netlify/functions/espn.js

exports.handler = async function (event) {
  // Only allow GET requests for this function
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  // The endpoint for the NFL fantasy players.
  // NOTE: This URL is unofficial and could change. We are using 2024 for stability.
  const ESPN_API_URL = 'https://fantasy.espn.com/apis/v3/games/ffl/seasons/2024/players?view=players_wl';

  try {
    const response = await fetch(ESPN_API_URL, {
      headers: {
        // This special header is required to get a full list of players, not just the top 50.
        'X-Fantasy-Filter': JSON.stringify({
          "players": {
            "limit": 1500, // Fetching a large number to ensure we get all relevant players
            "sortPercOwned": {
              "sortPriority": 1,
              "sortAsc": false
            }
          }
        })
      }
    });

    if (!response.ok) {
      throw new Error(`ESPN API request failed with status ${response.status}`);
    }

    const data = await response.json();

    return {
      statusCode: 200,
      body: JSON.stringify(data),
    };
  } catch (error) {
    console.error("Error fetching from ESPN API:", error);
    return { statusCode: 500, body: `An error occurred: ${error.message}` };
  }
};
