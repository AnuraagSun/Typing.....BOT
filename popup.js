document.getElementById("startBtn").onclick = () => {
  const text = document.getElementById("textToType").value;
  sendMessageToContent({ action: "start", text });
};

document.getElementById("stopBtn").onclick = () => {
  sendMessageToContent({ action: "stop" });
};

document.getElementById("deleteBtn").onclick = () => {
  sendMessageToContent({ action: "delete" });
};

function sendMessageToContent(message) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]?.id) {
      chrome.tabs.sendMessage(tabs[0].id, message);
    }
  });
}
