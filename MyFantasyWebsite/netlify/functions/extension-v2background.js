chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  if (message.action === "player_drafted") {
    const { playerName, pickNumber, isMyPick } = message;

    // TODO: determine draftId dynamically (e.g., from user input or site URL)
    const draftId = "demo_draft"; // <-- temporary placeholder
    const userId = "anonymous";   // <-- could be asked once via popup

    const payload = {
      draftId,
      playerName,
      pickNumber,
      userId,
      timestamp: Date.now()
    };

    try {
      const res = await fetch(
        "https://kchprojects.org/.netlify/functions/ingest-pick",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        }
      );
      console.log("Background posted pick:", res.status);
    } catch (e) {
      console.error("Background post failed", e);
    }
  }
});
