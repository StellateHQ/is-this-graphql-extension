import * as psl from "psl";

const enc = new TextDecoder("utf-8");

chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    try {
      // Only check requests from the page itself, not any embeds
      const initiator = psl.parse(new URL(details.initiator).hostname);
      const url = psl.parse(new URL(details.url).hostname);

      // @ts-ignore the TS types for the psl module are incorrect, .domain does exist.
      if (initiator.domain !== url.domain) return;

      // JSON body
      if (!details.requestBody?.raw?.[0]?.bytes) return;

      const body = enc
        .decode(details.requestBody.raw[0].bytes)
        .replace(/\s/g, "");

      if (typeof body !== "string") return;

      const isGraphQL =
        body.includes('"query":"{') ||
        body.includes('"query":"query') ||
        body.includes('"query":"mutation');

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
