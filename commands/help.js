const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("help")
    .setDescription("Lista os comandos disponíveis do TaniguchiBot"),
  async execute(interaction) {
    await interaction.reply({
      content: `
📖 **Comandos disponíveis:**
• \`/ping\` - Testa se o bot está ativo.
• \`/ticket\` - Abre o painel para criar tickets com botões.
• \`!trello <lista>\` - Busca cards da lista do Trello (ex: pedidos, produção).
      `,
      ephemeral: true,
    });
  },
};
