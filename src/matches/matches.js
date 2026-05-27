// FBMonitor Match Queue — full-page match dashboard with grouping,
// search, filtering, and reply tracking.

document.addEventListener("DOMContentLoaded", async function () {
  var searchInput = document.getElementById("search-input");
  var filterStatus = document.getElementById("filter-status");
  var filterKeyword = document.getElementById("filter-keyword");
  var collapseAllBtn = document.getElementById("collapse-all-btn");
  var expandAllBtn = document.getElementById("expand-all-btn");
  var matchGroupsEl = document.getElementById("match-groups");
  var emptyState = document.getElementById("empty-state");
  var totalCountEl = document.getElementById("total-count");
  var unrepliedCountEl = document.getElementById("unreplied-count");

  var clearAllBtn = document.getElementById("clear-all-btn");

  var allMatches = [];
  var repliedSet = {};
  var templates = {};

  await loadData();
  render();

  clearAllBtn.addEventListener("click", async function () {
    if (!confirm("Clear all match history and replied status?")) return;
    await FBM_Storage.clearMatchHistory();
    await chrome.storage.local.remove("fbmonitor_replied");
    await chrome.storage.local.remove(FBM_STORAGE_KEYS.SENT_HASHES);
    allMatches = [];
    repliedSet = {};
    render();
  });

  // Event listeners
  searchInput.addEventListener("input", render);
  filterStatus.addEventListener("change", render);
  filterKeyword.addEventListener("change", render);

  collapseAllBtn.addEventListener("click", function () {
    document.querySelectorAll(".group-card").forEach(function (card) {
      card.classList.add("collapsed");
    });
  });

  expandAllBtn.addEventListener("click", function () {
    document.querySelectorAll(".group-card").forEach(function (card) {
      card.classList.remove("collapsed");
    });
  });

  // Reload data every 5 seconds to pick up new matches
  setInterval(async function () {
    await loadData();
    render();
  }, 5000);

  async function loadData() {
    allMatches = await FBM_Storage.getMatchHistory();
    repliedSet = await getRepliedSet();
    templates = await FBM_Storage.getReplyTemplates();

    // Populate keyword filter
    var keywords = await FBM_Storage.getKeywords();
    var currentValue = filterKeyword.value;
    filterKeyword.innerHTML = '<option value="all">All keywords</option>';
    keywords.forEach(function (kw) {
      var opt = document.createElement("option");
      opt.value = kw;
      opt.textContent = kw;
      filterKeyword.appendChild(opt);
    });
    filterKeyword.value = currentValue;
  }

  function render() {
    var searchTerm = searchInput.value.toLowerCase().trim();
    var statusFilter = filterStatus.value;
    var keywordFilter = filterKeyword.value;

    // Filter matches
    var filtered = allMatches.filter(function (m) {
      var id = matchId(m);
      var isReplied = !!repliedSet[id];

      if (statusFilter === "unreplied" && isReplied) return false;
      if (statusFilter === "replied" && !isReplied) return false;

      if (
        keywordFilter !== "all" &&
        !(m.matchedKeywords || []).includes(keywordFilter)
      )
        return false;

      if (searchTerm) {
        var haystack = [
          m.postText || "",
          m.groupName || "",
          m.authorName || "",
          (m.matchedKeywords || []).join(" "),
        ]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(searchTerm)) return false;
      }

      return true;
    });

    // Update stats
    var totalReplied = allMatches.filter(function (m) {
      return repliedSet[matchId(m)];
    }).length;
    totalCountEl.textContent = allMatches.length + " matches";
    unrepliedCountEl.textContent =
      allMatches.length - totalReplied + " unreplied";

    // Group by Facebook group
    var groups = {};
    filtered.forEach(function (m) {
      var gname = m.groupName || "Unknown Group";
      if (!groups[gname]) groups[gname] = [];
      groups[gname].push(m);
    });

    // Sort groups by most recent match
    var groupNames = Object.keys(groups).sort(function (a, b) {
      var aTime = groups[a][0] ? groups[a][0].timestamp : 0;
      var bTime = groups[b][0] ? groups[b][0].timestamp : 0;
      return bTime - aTime;
    });

    matchGroupsEl.innerHTML = "";

    if (groupNames.length === 0) {
      emptyState.style.display = "block";
      return;
    }
    emptyState.style.display = "none";

    groupNames.forEach(function (gname) {
      var matches = groups[gname];
      var unreplied = matches.filter(function (m) {
        return !repliedSet[matchId(m)];
      }).length;

      var card = document.createElement("div");
      card.className = "group-card";

      // Group header
      var header = document.createElement("div");
      header.className = "group-header";
      header.innerHTML =
        '<div class="group-header-left">' +
        '<span class="group-name">' +
        escapeHtml(gname) +
        "</span>" +
        '<span class="group-count">' +
        matches.length +
        "</span>" +
        (unreplied > 0
          ? '<span class="group-unreplied">' + unreplied + " unreplied</span>"
          : "") +
        "</div>" +
        '<span class="group-toggle">&#9660;</span>';

      header.addEventListener("click", function () {
        card.classList.toggle("collapsed");
      });

      // Match list
      var matchList = document.createElement("div");
      matchList.className = "group-matches";

      matches.forEach(function (m) {
        var id = matchId(m);
        var isReplied = !!repliedSet[id];
        var kwTags = (m.matchedKeywords || [])
          .map(function (kw) {
            return '<span class="match-kw-tag">' + escapeHtml(kw) + "</span>";
          })
          .join(" ");

        var firstTemplate = null;
        (m.matchedKeywords || []).forEach(function (kw) {
          if (!firstTemplate && templates[kw]) firstTemplate = templates[kw];
        });

        var row = document.createElement("div");
        row.className = "match-row" + (isReplied ? " replied" : "");
        row.innerHTML =
          '<div class="match-status"></div>' +
          '<div class="match-body">' +
          '<div class="match-meta">' +
          '<span class="match-author">' +
          escapeHtml(m.authorName || "Unknown") +
          "</span>" +
          kwTags +
          '<span class="match-time">' +
          formatTime(m.timestamp) +
          "</span>" +
          "</div>" +
          '<div class="match-text">' +
          escapeHtml(m.postText || "") +
          "</div>" +
          '<div class="match-actions">' +
          '<button class="btn btn-sm open-post" data-url="' +
          escapeHtml(m.postUrl || "") +
          '">Open Post</button>' +
          (firstTemplate
            ? '<button class="btn btn-sm btn-copy copy-reply" data-reply="' +
              escapeHtml(firstTemplate) +
              '">Copy Reply</button>'
            : "") +
          '<button class="btn btn-sm ' +
          (isReplied ? "btn-replied" : "btn-primary") +
          ' toggle-replied" data-id="' +
          escapeHtml(id) +
          '">' +
          (isReplied ? "Replied" : "Mark Replied") +
          "</button>" +
          "</div>" +
          "</div>";

        matchList.appendChild(row);
      });

      card.appendChild(header);
      card.appendChild(matchList);
      matchGroupsEl.appendChild(card);
    });

    // Event delegation for actions
    matchGroupsEl.onclick = async function (e) {
      var openBtn = e.target.closest(".open-post");
      if (openBtn) {
        var url = openBtn.dataset.url;
        if (url) chrome.tabs.create({ url: url });
        return;
      }

      var copyBtn = e.target.closest(".copy-reply");
      if (copyBtn) {
        var reply = copyBtn.dataset.reply;
        if (reply) {
          await navigator.clipboard.writeText(reply);
          copyBtn.textContent = "Copied!";
          setTimeout(function () {
            copyBtn.textContent = "Copy Reply";
          }, 1500);
        }
        return;
      }

      var repliedBtn = e.target.closest(".toggle-replied");
      if (repliedBtn) {
        var mid = repliedBtn.dataset.id;
        if (repliedSet[mid]) {
          delete repliedSet[mid];
        } else {
          repliedSet[mid] = Date.now();
        }
        await saveRepliedSet(repliedSet);
        render();
        return;
      }
    };
  }

  function matchId(m) {
    return (m.postUrl || "") + "|" + (m.matchedKeywords || []).join(",");
  }

  function formatTime(ts) {
    if (!ts) return "";
    var d = new Date(ts);
    var now = new Date();
    var diffMs = now - d;
    var diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return "just now";
    if (diffMin < 60) return diffMin + "m ago";
    var diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return diffHr + "h ago";
    var diffDay = Math.floor(diffHr / 24);
    if (diffDay < 7) return diffDay + "d ago";
    return d.toLocaleDateString();
  }

  async function getRepliedSet() {
    var result = await chrome.storage.local.get("fbmonitor_replied");
    return result["fbmonitor_replied"] || {};
  }

  async function saveRepliedSet(set) {
    await chrome.storage.local.set({ fbmonitor_replied: set });
  }

  function escapeHtml(str) {
    var div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }
});
