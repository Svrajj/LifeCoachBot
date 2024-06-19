import { GoogleGenerativeAI } from "@google/generative-ai";
import md from "markdown-it";

// Initialize the model
const genAI = new GoogleGenerativeAI(`${import.meta.env.VITE_API_KEY}`);

const model = genAI.getGenerativeModel({ model: "gemini-pro" });

let history = [];

async function getResponse(prompt) {
    const chat = await model.startChat({ history: history });
    const result = await chat.sendMessage(prompt);
    const response = await result.response;
    const text = await response.text();

    console.log(text);
    return text;
}

function limitResponseToThreeParagraphs(text) {
    const paragraphs = text.split(/\n\s*\n/); // Split by paragraph
    const limitedText = paragraphs.slice(0, 3).join('\n\n'); // Take up to 3 paragraphs
    return limitedText;
}

export const userDiv = (data) => {
    return `
        <!-- user chat -->
          <div class="flex items-center gap-5 ml-20 mr-20 mt-10 text-wrap place-content-center">
            <p class="text-gemtext bg-gemtextbguser p-3 rounded-md">
            ${data}
            </p>
            <img src="user.jpg" alt="user image" class="w-14 h-14 rounded-full" />
          </div>
    `;
}

export const aiDiv = (data) => {
    return `
        <!-- bot chat -->
        <div class="flex gap-5 items-center ml-20 mr-20 text-wrap place-content-center">
            <img src="bot.jpg" alt="bot image" class="w-14 h-14 rounded-full" />
            <pre class="bg-gemtextbg text-gemtext items-center p-3 rounded-md text-wrap">
              ${data}
            </pre>
          </div>
    `;
}

export const loadingDiv = () => {
    return `
        <!-- loading indicator -->
        <div id="loading" class="flex gap-5 items-center ml-20 mr-20 text-wrap place-content-center">
            <img src="bot.jpg" alt="bot image" class="w-14 h-14 rounded-full" />
            <p class="bg-gemtextbg text-gemtext items-center p-3 rounded-md text-wrap">
              Loading...
            </p>
          </div>
    `;
}

async function handleSubmit(event) {
    event.preventDefault();

    let userMessage = document.getElementById("prompt");
    const chatArea = document.getElementById("chat-container");

    var prompt = userMessage.value.trim();
    if (prompt === "") {
        return;
    }

    console.log("user message", prompt);

    chatArea.innerHTML += userDiv(prompt);
    userMessage.value = "";

    // Add loading indicator
    chatArea.innerHTML += loadingDiv();

    const aiResponse = await getResponse(prompt);
    const limitedResponse = limitResponseToThreeParagraphs(aiResponse);
    let md_text = md().render(limitedResponse);

    // Remove loading indicator
    document.getElementById("loading").remove();

    chatArea.innerHTML += aiDiv(md_text);

    let newUserRole = {
        role: "user",
        parts: [prompt], // Ensure parts is an array
    };
    let newAIRole = {
        role: "model",
        parts: [limitedResponse], // Ensure parts is an array
    };

    history.push(newUserRole);
    history.push(newAIRole);

    console.log(history);
}

function displayWelcomeMessage() {
    const chatArea = document.getElementById("chat-container");
    const welcomeMessage = "Hello! I'm your life coach bot. How can I assist you today? Feel free to share your thoughts or ask for advice.";
    chatArea.innerHTML += aiDiv(welcomeMessage);
}

window.addEventListener("DOMContentLoaded", (event) => {
    displayWelcomeMessage();
});

const chatForm = document.getElementById("chat-form");
chatForm.addEventListener("submit", handleSubmit);

chatForm.addEventListener("keyup", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault(); // Prevent the default action of the Enter key
        handleSubmit(event);
    }
});
