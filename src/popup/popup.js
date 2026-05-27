// FBMonitor popup — keyword management, toggles, and match queue link.

document.addEventListener("DOMContentLoaded", async function () {
  var keywordInput = document.getElementById("keyword-input");
  var addKeywordBtn = document.getElementById("add-keyword-btn");
  var keywordListEl = document.getElementById("keyword-list");
  var highlightToggle = document.getElementById("highlight-toggle");
  var webhookToggle = document.getElementById("webhook-toggle");
  var matchCountEl = document.getElementById("match-count");
  var unrepliedSummary = document.getElementById("unreplied-summary");
  var openMatchesBtn = document.getElementById("open-matches-btn");
  var optionsBtn = document.getElementById("options-btn");

  await renderKeywords();
  highlightToggle.checked = await FBM_Storage.getHighlightEnabled();
  webhookToggle.checked = await FBM_Storage.getWebhookEnabled();
  await updateMatchStats();

  // Add keyword
  async function addKeyword() {
    var value = keywordInput.value.trim();
    if (!value) return;
    await FBM_Storage.addKeyword(value);
    keywordInput.value = "";
    await renderKeywords();
    notifyContentScripts();
  }

  addKeywordBtn.addEventListener("click", addKeyword);
  keywordInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter") addKeyword();
  });

  highlightToggle.addEventListener("change", async function () {
    await FBM_Storage.setHighlightEnabled(highlightToggle.checked);
    notifyContentScripts();
  });

  webhookToggle.addEventListener("change", async function () {
    await FBM_Storage.setWebhookEnabled(webhookToggle.checked);
  });

  // Open full match queue page
  openMatchesBtn.addEventListener("click", function () {
    chrome.tabs.create({ url: chrome.runtime.getURL("matches/matches.html") });
  });

  optionsBtn.addEventListener("click", function () {
    chrome.runtime.openOptionsPage();
  });

  async function renderKeywords() {
    var keywords = await FBM_Storage.getKeywords();
    keywordListEl.innerHTML = "";

    if (keywords.length === 0) {
      keywordListEl.innerHTML =
        '<span class="empty-state">No keywords configured</span>';
      return;
    }

    keywords.forEach(function (kw) {
      var chip = document.createElement("span");
      chip.className = "keyword-chip";

      var text = document.createElement("span");
      text.textContent = kw;

      var removeBtn = document.createElement("button");
      removeBtn.className = "remove-keyword";
      removeBtn.textContent = "×";
      removeBtn.addEventListener("click", async function () {
        await FBM_Storage.removeKeyword(kw);
        await renderKeywords();
        notifyContentScripts();
      });

      chip.appendChild(text);
      chip.appendChild(removeBtn);
      keywordListEl.appendChild(chip);
    });
  }

  async function updateMatchStats() {
    try {
      var response = await chrome.runtime.sendMessage({
        type: FBM_MESSAGE_TYPES.GET_MATCH_QUEUE,
      });
      var matches = (response && response.matches) || [];

      var todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      var todayMatches = matches.filter(function (m) {
        return m.timestamp >= todayStart.getTime();
      });
      matchCountEl.textContent = todayMatches.length;

      var replied = await chrome.storage.local.get("fbmonitor_replied");
      var repliedSet = replied["fbmonitor_replied"] || {};
      var unreplied = matches.filter(function (m) {
        var id = (m.postUrl || "") + "|" + (m.matchedKeywords || []).join(",");
        return !repliedSet[id];
      }).length;
      unrepliedSummary.textContent = unreplied + " unreplied";
    } catch (e) {
      matchCountEl.textContent = "0";
      unrepliedSummary.textContent = "0 unreplied";
    }
  }

  function notifyContentScripts() {
    chrome.tabs.query(
      { url: "https://www.facebook.com/groups/*" },
      function (tabs) {
        (tabs || []).forEach(function (tab) {
          chrome.tabs.sendMessage(tab.id, {
            type: FBM_MESSAGE_TYPES.CONFIG_UPDATED,
          });
        });
      },
    );
  }
});
