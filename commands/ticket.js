// commands/ticket.js
const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ticket")
    .setDescription("Abre o painel para criar um ticket com categorias"),

  async execute(interaction) {
    // Aqui só enviamos o painel de botões (sem await fora de async!)
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("pedido_ticket")
        .setLabel("📦 Pedido")
        .setStyle(ButtonStyle.Primary),

      new ButtonBuilder()
        .setCustomId("duvida_ticket")
        .setLabel("❓ Dúvida")
        .setStyle(ButtonStyle.Secondary),

      new ButtonBuilder()
        .setCustomId("sugestao_ticket")
        .setLabel("💡 Sugestão")
        .setStyle(ButtonStyle.Success),

      new ButtonBuilder()
        .setCustomId("problema_ticket")
        .setLabel("🚨 Problema")
        .setStyle(ButtonStyle.Danger),
    );

    await interaction.reply({
      content: "🛠️ Selecione a categoria para abrir um ticket:",
      components: [row],
      ephemeral: true,
    });
  },
};
