// events/messageCreate.js
const { askDeepSeek } = require("../utils/deepseekAI");

module.exports = {
  name: "messageCreate",
  async execute(message) {
    if (message.author.bot) return;
    if (message.channel.topic !== "AI_CHAT") return;

    const placeholder = await message.channel.send(
      "⌛ Processando sua pergunta…",
    );
    const history = [
      {
        role: "system",
        content:
          "Você é um assistente especializado em marcenaria, serralheria e CNC.",
      },
      { role: "user", content: message.content },
    ];

    try {
      const answer = await askDeepSeek(history);
      await placeholder.edit(answer);
    } catch (err) {
      console.error(
        "DeepSeek falhou completamente:",
        err.response?.status,
        err.response?.data,
      );
      await placeholder.edit(
        "❌ Não consegui consultar a IA agora. Tente novamente mais tarde.",
      );
    }
  },
};
