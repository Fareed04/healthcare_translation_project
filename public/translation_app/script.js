const startButton = document.getElementById("start-recording");
const stopButton = document.getElementById("stop-recording");
const restartButton = document.getElementById("restart-recording");
const speakButton = document.getElementById("speak-translation");
const transcription = document.getElementById("transcription");
const translatedText = document.getElementById("translated-text");
const targetLanguage = document.getElementById("target-language");
const micIndicator = document.getElementById("mic-indicator");

let recognition;
let isListening = false;
let lastTranslatedLine = "";

function initSpeechRecognition() {
    recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.continuous = true;

    recognition.onstart = () => micIndicator.style.display = "inline-block";
    recognition.onend = () => micIndicator.style.display = "none";

    recognition.onresult = async (event) => {
        let newTranscript = event.results[event.resultIndex][0].transcript.trim();
        if (newTranscript) {
            appendText(transcription, newTranscript); // Append new line in transcription
            showLoader(translatedText);
            await translateText(newTranscript);
        }
    };

    recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        transcription.textContent = "Error: " + event.error;
    };
}

async function translateText(text) {
    const lang = targetLanguage.value;
    if (!text) return;

    try {
        const response = await fetch("/translate/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text, language: lang }),
        });

        const data = await response.json();
        hideLoader(translatedText);
        appendText(translatedText, data.translated_text || "Translation error"); // Append translation instead of replacing
        lastTranslatedLine = data.translated_text || "";
    } catch (error) {
        console.error("Translation error:", error);
        hideLoader(translatedText);
        appendText(translatedText, "Translation error!");
    }
}

// Append text to the container, maintaining line sequence
function appendText(container, text) {
    let newLine = document.createElement("div");
    newLine.classList.add("animated-text");
    container.appendChild(newLine);
    typeText(newLine, text);
}

// Typewriter Effect for New Lines
function typeText(element, text) {
    let i = 0;
    function type() {
        if (i < text.length) {
            element.textContent += text[i];
            i++;
            setTimeout(type, 50);
        }
    }
    type();
}

// Loader Animation
function showLoader(element) {
    let loader = document.createElement("div");
    loader.classList.add("loader-circle");
    element.appendChild(loader);
}

function hideLoader(element) {
    let loaders = element.getElementsByClassName("loader-circle");
    while (loaders.length > 0) {
        loaders[0].remove();
    }
}

// Speak Only Last Translated Line
function speakTranslation() {
    if (!lastTranslatedLine || lastTranslatedLine === "Translation error!") return;
    const speech = new SpeechSynthesisUtterance(lastTranslatedLine);
    speech.lang = targetLanguage.value;
    window.speechSynthesis.speak(speech);
}

// Initialize Speech Recognition
initSpeechRecognition();

startButton.addEventListener("click", () => {
    if (!isListening) {
        recognition.start();
        isListening = true;
    }
});

stopButton.addEventListener("click", () => {
    if (isListening) {
        recognition.stop();
        isListening = false;
    }
});

restartButton.addEventListener("click", () => {
    if (isListening) {
        recognition.stop();
    }
    transcription.innerHTML = "";
    translatedText.innerHTML = "";
    lastTranslatedLine = "";
    isListening = false;
    initSpeechRecognition();
});

speakButton.addEventListener("click", speakTranslation);
