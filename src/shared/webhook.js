// FBMonitor webhook payload formatters.
// Used by the service worker (imported as ES module).

export function formatTeamsPayload(match) {
  return {
    type: "message",
    attachments: [
      {
        contentType: "application/vnd.microsoft.card.adaptive",
        contentUrl: null,
        content: {
          $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
          type: "AdaptiveCard",
          version: "1.4",
          body: [
            {
              type: "TextBlock",
              text: "FBMonitor — Keyword Match",
              weight: "Bolder",
              size: "Medium",
              color: "Accent",
            },
            {
              type: "FactSet",
              facts: [
                { title: "Group", value: match.groupName || "Unknown" },
                { title: "Author", value: match.authorName || "Unknown" },
                {
                  title: "Keywords",
                  value: (match.matchedKeywords || []).join(", "),
                },
                {
                  title: "Time",
                  value: new Date(match.timestamp).toLocaleString(),
                },
              ],
            },
            {
              type: "TextBlock",
              text: match.postText || "",
              wrap: true,
              maxLines: 6,
            },
          ],
          actions: [
            {
              type: "Action.OpenUrl",
              title: "View Post",
              url: match.postUrl || "https://www.facebook.com",
            },
          ],
        },
      },
    ],
  };
}

export function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return "fbm_" + Math.abs(hash).toString(36);
}
