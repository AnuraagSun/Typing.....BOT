let typingInterval;
let currentIndex = 0;
let textToType = "";

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "start") {
    textToType = request.text;
    currentIndex = 0;
    startTyping();
  } else if (request.action === "stop") {
    stopTyping();
  } else if (request.action === "delete") {
    deleteTypedText();
  }
});

function getInputField() {
  const url = window.location.href;

  if (url.includes("whatsapp")) {
    return document.querySelector("[contenteditable='true']");
  } else if (url.includes("discord")) {
    return document.querySelector("div[role='textbox']");
  }

  return null;
}

function startTyping() {
  const inputField = getInputField();
  if (!inputField) return alert("Input field not found!");

  stopTyping(); // Clear previous interval

  typingInterval = setInterval(() => {
    if (currentIndex >= textToType.length) {
      stopTyping();
      return;
    }

    const char = textToType[currentIndex];
    inputField.focus();

    // Simulate typing
    insertText(inputField, textToType.slice(0, currentIndex + 1));
    currentIndex++;

    // Random pause between 100ms to 500ms
    const delay = Math.random() * (500 - 100) + 100;
    clearInterval(typingInterval);
    setTimeout(startTyping, delay);

  }, 0);
}

function stopTyping() {
  clearInterval(typingInterval);
}

function deleteTypedText() {
  const inputField = getInputField();
  if (inputField) {
    insertText(inputField, "");
  }
}

function insertText(element, text) {
  const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
    window.HTMLTextAreaElement.prototype,
    "value"
  )?.set;

  element.focus();

  if (element.tagName === "DIV") {
    element.innerText = text;
  } else {
    nativeInputValueSetter.call(element, text);
    element.dispatchEvent(new Event("input", { bubbles: true }));
  }
}
