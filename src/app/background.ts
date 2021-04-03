const enc = new TextDecoder("utf-8");

chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    try {
      if (!details.requestBody?.raw?.[0]?.bytes) return;

      const body = enc.decode(details.requestBody.raw[0].bytes);

      if (typeof body !== "string") return;

      const isGraphQL =
        body.replace(/\s/g, "").includes('"query":"query') ||
        body.replace(/\s/g, "").includes('"query":"mutation');

      if (isGraphQL) {
        chrome.browserAction.setBadgeBackgroundColor({ color: "#10B981" });
        chrome.browserAction.setBadgeText({ text: "✓", tabId: details.tabId });
      }
    } catch (err) {}
  },
  { urls: ["<all_urls>"] },
  ["requestBody"]
);
