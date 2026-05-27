// Tests for webhook payload formatting.

// Import the formatter (we inline it for testing since ES modules aren't
// available in the test environment without a build step).
function formatTeamsPayload(match) {
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

function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return "fbm_" + Math.abs(hash).toString(36);
}

describe("formatTeamsPayload", () => {
  const sampleMatch = {
    postText: "Looking for home insurance recommendations",
    matchedKeywords: ["insurance"],
    postUrl: "https://www.facebook.com/groups/123/posts/456",
    authorName: "Jane Doe",
    groupName: "Local Homeowners",
    timestamp: 1716768000000,
  };

  test("produces valid Adaptive Card structure", () => {
    const payload = formatTeamsPayload(sampleMatch);
    expect(payload.type).toBe("message");
    expect(payload.attachments).toHaveLength(1);
    expect(payload.attachments[0].contentType).toBe(
      "application/vnd.microsoft.card.adaptive",
    );
    expect(payload.attachments[0].content.type).toBe("AdaptiveCard");
    expect(payload.attachments[0].content.version).toBe("1.4");
  });

  test("includes group name in facts", () => {
    const payload = formatTeamsPayload(sampleMatch);
    const facts = payload.attachments[0].content.body[1].facts;
    expect(facts[0]).toEqual({ title: "Group", value: "Local Homeowners" });
  });

  test("includes author name in facts", () => {
    const payload = formatTeamsPayload(sampleMatch);
    const facts = payload.attachments[0].content.body[1].facts;
    expect(facts[1]).toEqual({ title: "Author", value: "Jane Doe" });
  });

  test("includes matched keywords in facts", () => {
    const payload = formatTeamsPayload(sampleMatch);
    const facts = payload.attachments[0].content.body[1].facts;
    expect(facts[2]).toEqual({ title: "Keywords", value: "insurance" });
  });

  test("includes post text in body", () => {
    const payload = formatTeamsPayload(sampleMatch);
    const textBlock = payload.attachments[0].content.body[2];
    expect(textBlock.text).toBe(sampleMatch.postText);
    expect(textBlock.wrap).toBe(true);
  });

  test("includes View Post action with correct URL", () => {
    const payload = formatTeamsPayload(sampleMatch);
    const action = payload.attachments[0].content.actions[0];
    expect(action.type).toBe("Action.OpenUrl");
    expect(action.url).toBe(sampleMatch.postUrl);
  });

  test("handles missing fields gracefully", () => {
    const payload = formatTeamsPayload({
      timestamp: Date.now(),
    });
    const facts = payload.attachments[0].content.body[1].facts;
    expect(facts[0].value).toBe("Unknown");
    expect(facts[1].value).toBe("Unknown");
    expect(facts[2].value).toBe("");
  });

  test("handles multiple keywords", () => {
    const payload = formatTeamsPayload({
      ...sampleMatch,
      matchedKeywords: ["insurance", "agent"],
    });
    const facts = payload.attachments[0].content.body[1].facts;
    expect(facts[2].value).toBe("insurance, agent");
  });
});

describe("simpleHash", () => {
  test("produces consistent hash for same input", () => {
    const hash1 = simpleHash("test-input");
    const hash2 = simpleHash("test-input");
    expect(hash1).toBe(hash2);
  });

  test("produces different hashes for different inputs", () => {
    const hash1 = simpleHash("input-a");
    const hash2 = simpleHash("input-b");
    expect(hash1).not.toBe(hash2);
  });

  test("starts with fbm_ prefix", () => {
    const hash = simpleHash("anything");
    expect(hash).toMatch(/^fbm_/);
  });

  test("handles empty string", () => {
    const hash = simpleHash("");
    expect(hash).toBe("fbm_0");
  });
});
