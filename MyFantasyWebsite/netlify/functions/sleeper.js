// This is your new serverless function to fetch data from the Sleeper API.
// File location: netlify/functions/sleeper.js

exports.handler = async function (event) {
  // Only allow GET requests for this function
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  // The public endpoint for all NFL player data from Sleeper.
  const SLEEPER_API_URL = 'https://api.sleeper.app/v1/players/nfl';

  try {
    const response = await fetch(SLEEPER_API_URL, {
      headers: {
        // Adding a User-Agent header to identify our request to the API
        'User-Agent': 'Fantasy-Football-Draft-App/1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`Sleeper API request failed with status ${response.status}`);
    }

    const data = await response.json();

    return {
      statusCode: 200,
      body: JSON.stringify(data),
    };
  } catch (error) {
    console.error("Error fetching from Sleeper API:", error);
    return { statusCode: 500, body: `An error occurred: ${error.message}` };
  }
};
