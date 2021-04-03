const enc = new TextDecoder("utf-8");

chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    try {
      if (!details.requestBody?.raw?.[0]?.bytes) return;

      const body = enc
        .decode(details.requestBody.raw[0].bytes)
        .replace(/\s/g, "");

      if (typeof body !== "string") return;

      const isGraphQL =
        body.includes('"query":"query') || body.includes('"query":"mutation');

      if (isGraphQL) {
        chrome.browserAction.setIcon({
          tabId: details.tabId,
          path: "/icons/graphql-true.png",
        });
      }
    } catch (err) {}
  },
  { urls: ["<all_urls>"] },
  ["requestBody"]
);
