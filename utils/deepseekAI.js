// utils/deepseekAI.js
const axios = require("axios");

const OR_URL = "https://openrouter.ai/api/v1/chat/completions";
const OR_TOKEN = process.env.OPENROUTER_API_KEY;
const MODEL = "deepseek/deepseek-chat";

async function askDeepSeek(messages) {
  try {
    const resp = await axios.post(
      OR_URL,
      {
        model: MODEL,
        messages, // array de { role, content }
        temperature: 0.7,
        max_tokens: 500,
      },
      {
        headers: {
          Authorization: `Bearer ${OR_TOKEN}`,
          "Content-Type": "application/json",
        },
        timeout: 60000,
      },
    );
    return resp.data.choices[0].message.content;
  } catch (err) {
    console.error(
      "❌ deepseekAI error:",
      err.response?.status,
      err.response?.data || err.message,
    );
    throw err;
  }
}

module.exports = { askDeepSeek };
