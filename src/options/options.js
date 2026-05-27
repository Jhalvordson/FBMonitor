// FBMonitor options page — webhook config, reply templates, match history.

document.addEventListener("DOMContentLoaded", async () => {
  const webhookUrlInput = document.getElementById("webhook-url");
  const rateLimitInput = document.getElementById("rate-limit");
  const saveWebhookBtn = document.getElementById("save-webhook-btn");
  const testWebhookBtn = document.getElementById("test-webhook-btn");
  const webhookStatus = document.getElementById("webhook-status");
  const templateListEl = document.getElementById("template-list");
  const noKeywordsMsg = document.getElementById("no-keywords-msg");
  const exportCsvBtn = document.getElementById("export-csv-btn");
  const clearHistoryBtn = document.getElementById("clear-history-btn");
  const historyBody = document.getElementById("history-body");

  // Load saved values
  webhookUrlInput.value = await FBM_Storage.getWebhookUrl();
  rateLimitInput.value = await FBM_Storage.getRateLimitSec();

  await renderTemplates();
  await renderHistory();

  // Save webhook settings
  saveWebhookBtn.addEventListener("click", async () => {
    await FBM_Storage.setWebhookUrl(webhookUrlInput.value.trim());
    await chrome.storage.sync.set({
      [FBM_STORAGE_KEYS.RATE_LIMIT_SEC]: parseInt(rateLimitInput.value) || 10,
    });
    showStatus(webhookStatus, "Saved!", "success");
  });

  // Test webhook
  testWebhookBtn.addEventListener("click", async () => {
    const url = webhookUrlInput.value.trim();
    if (!url) {
      showStatus(webhookStatus, "Enter a webhook URL first.", "error");
      return;
    }

    showStatus(webhookStatus, "Sending test...", "");

    const testPayload = {
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
                text: "FBMonitor — Test Notification",
                weight: "Bolder",
                size: "Medium",
                color: "Accent",
              },
              {
                type: "TextBlock",
                text: "If you see this, your webhook is configured correctly!",
                wrap: true,
              },
              {
                type: "FactSet",
                facts: [
                  { title: "Status", value: "Connected" },
                  {
                    title: "Time",
                    value: new Date().toLocaleString(),
                  },
                ],
              },
            ],
          },
        },
      ],
    };

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(testPayload),
      });

      if (response.ok) {
        showStatus(webhookStatus, "Test sent successfully!", "success");
      } else {
        showStatus(
          webhookStatus,
          `Failed: ${response.status} ${response.statusText}`,
          "error",
        );
      }
    } catch (err) {
      showStatus(webhookStatus, `Error: ${err.message}`, "error");
    }
  });

  // Render reply templates
  async function renderTemplates() {
    const keywords = await FBM_Storage.getKeywords();
    const templates = await FBM_Storage.getReplyTemplates();

    templateListEl.innerHTML = "";

    if (keywords.length === 0) {
      noKeywordsMsg.style.display = "block";
      return;
    }
    noKeywordsMsg.style.display = "none";

    keywords.forEach((kw) => {
      const item = document.createElement("div");
      item.className = "template-item";

      const label = document.createElement("div");
      label.className = "keyword-label";
      label.textContent = kw;

      const textarea = document.createElement("textarea");
      textarea.placeholder = `Reply template for "${kw}"...`;
      textarea.value = templates[kw] || "";

      const saveBtn = document.createElement("button");
      saveBtn.className = "btn btn-primary btn-sm";
      saveBtn.textContent = "Save Template";
      saveBtn.addEventListener("click", async () => {
        const currentTemplates = await FBM_Storage.getReplyTemplates();
        if (textarea.value.trim()) {
          currentTemplates[kw] = textarea.value.trim();
        } else {
          delete currentTemplates[kw];
        }
        await FBM_Storage.setReplyTemplates(currentTemplates);
        saveBtn.textContent = "Saved!";
        setTimeout(() => (saveBtn.textContent = "Save Template"), 1500);
      });

      item.appendChild(label);
      item.appendChild(textarea);
      item.appendChild(saveBtn);
      templateListEl.appendChild(item);
    });
  }

  // Render match history
  async function renderHistory() {
    const history = await FBM_Storage.getMatchHistory();
    historyBody.innerHTML = "";

    if (history.length === 0) {
      historyBody.innerHTML =
        '<tr><td colspan="5" style="text-align:center; color:#555; padding:20px;">No matches recorded yet.</td></tr>';
      return;
    }

    history.forEach((match) => {
      const row = document.createElement("tr");
      const time = new Date(match.timestamp).toLocaleString();
      const keywords = (match.matchedKeywords || []).join(", ");
      const preview = (match.postText || "").substring(0, 80);

      row.innerHTML = `
        <td>${escapeHtml(time)}</td>
        <td>${escapeHtml(match.groupName || "Unknown")}</td>
        <td style="color:#ff6600">${escapeHtml(keywords)}</td>
        <td class="preview-cell" title="${escapeHtml(match.postText || "")}">${escapeHtml(preview)}</td>
        <td><a href="${escapeHtml(match.postUrl || "#")}" target="_blank">View</a></td>
      `;
      historyBody.appendChild(row);
    });
  }

  // Export CSV
  exportCsvBtn.addEventListener("click", async () => {
    const history = await FBM_Storage.getMatchHistory();
    if (history.length === 0) return;

    const headers = ["Time", "Group", "Author", "Keywords", "Post Text", "URL"];
    const rows = history.map((m) => [
      new Date(m.timestamp).toISOString(),
      m.groupName || "",
      m.authorName || "",
      (m.matchedKeywords || []).join("; "),
      (m.postText || "").replace(/"/g, '""'),
      m.postUrl || "",
    ]);

    let csv = headers.join(",") + "\n";
    rows.forEach((row) => {
      csv += row.map((cell) => `"${cell}"`).join(",") + "\n";
    });

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fbmonitor-matches-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  });

  // Clear history
  clearHistoryBtn.addEventListener("click", async () => {
    await FBM_Storage.clearMatchHistory();
    await renderHistory();
  });

  function showStatus(el, message, type) {
    el.textContent = message;
    el.className = "status-msg" + (type ? ` ${type}` : "");
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }
});
