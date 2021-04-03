chrome.runtime.onMessage.addListener(function (request, sender) {
  console.log(
    sender.tab
      ? "from a content script:" + sender.tab.url
      : "from the extension"
  );
});
