const fetch = require("node-fetch");

exports.handler = async () => {
    try {
        // Get all NFL players
        const playersRes = await fetch("https://api.sleeper.app/v1/players/nfl");
        const playersData = await playersRes.json();

        // Get Sleeper's official PPR rankings
        const rankingsRes = await fetch("https://api.sleeper.app/v1/draft-rankings/nfl/ppr");
        const rankingsData = await rankingsRes.json();

        // Map player_id to their ranking position
        const rankingsMap = {};
        rankingsData.forEach((p, idx) => {
            rankingsMap[p.player_id] = idx + 1; // true order from Sleeper
        });

        // Merge rank into player data
        const merged = Object.values(playersData)
            .filter(p => p.position && p.status !== "Inactive")
            .map(p => ({
                player_id: p.player_id,
                full_name: p.full_name,
                position: p.position,
                team: p.team || "FA",
                adp: p.adp ?? 999,
                adp_ppr: p.adp_ppr ?? 999,
                rank: rankingsMap[p.player_id] || 999 // fallback if missing
            }));

        return {
            statusCode: 200,
            body: JSON.stringify(merged)
        };
    } catch (err) {
        return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
    }
};
