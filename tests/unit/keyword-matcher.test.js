// Tests for keyword matching logic used by the content script.

function matchKeywords(text, keywords) {
  const lowerText = text.toLowerCase();
  return keywords.filter((kw) => lowerText.includes(kw.toLowerCase()));
}

describe("matchKeywords", () => {
  test("matches a single keyword", () => {
    const result = matchKeywords("Looking for home insurance recommendations", [
      "insurance",
    ]);
    expect(result).toEqual(["insurance"]);
  });

  test("matches multiple keywords", () => {
    const result = matchKeywords(
      "Need insurance for my home. Any agent recommendations?",
      ["insurance", "agent", "plumber"],
    );
    expect(result).toEqual(["insurance", "agent"]);
  });

  test("is case insensitive", () => {
    const result = matchKeywords("INSURANCE quotes needed!", ["insurance"]);
    expect(result).toEqual(["insurance"]);
  });

  test("returns empty array when no match", () => {
    const result = matchKeywords("Looking for a good plumber", [
      "insurance",
      "agent",
    ]);
    expect(result).toEqual([]);
  });

  test("returns empty array with no keywords", () => {
    const result = matchKeywords("Some post text", []);
    expect(result).toEqual([]);
  });

  test("returns empty array with empty text", () => {
    const result = matchKeywords("", ["insurance"]);
    expect(result).toEqual([]);
  });

  test("matches keyword within larger word", () => {
    const result = matchKeywords("reinsurance market is changing", [
      "insurance",
    ]);
    expect(result).toEqual(["insurance"]);
  });

  test("handles special characters in text", () => {
    const result = matchKeywords("Need insurance!!! #help @everyone", [
      "insurance",
    ]);
    expect(result).toEqual(["insurance"]);
  });

  test("handles multi-word keywords", () => {
    const result = matchKeywords("Looking for home insurance agent", [
      "home insurance",
    ]);
    expect(result).toEqual(["home insurance"]);
  });
});
