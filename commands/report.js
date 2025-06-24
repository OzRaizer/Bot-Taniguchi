// commands/report.js
const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const { generateSearchReport } = require("../utils/generateSearchReport");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("report")
    .setDescription("📊 Relatórios Trello: diário ou avançado")
    .addStringOption((opt) =>
      opt
        .setName("busca")
        .setDescription("Termo para busca avançada (Admin/Suporte)")
        .setRequired(false),
    ),

  async execute(interaction) {
    const term = interaction.options.getString("busca");

    // AVANÇADO: só Admin/Suporte
    if (term) {
      const member = interaction.member;
      if (
        !member.roles.cache.has(process.env.ADMIN_ROLE_ID) &&
        !member.roles.cache.has(process.env.SUPPORT_ROLE_ID)
      ) {
        return interaction.reply({
          content: "❌ Sem permissão.",
          ephemeral: true,
        });
      }
      await interaction.deferReply({ ephemeral: true });
      const file = await generateSearchReport(term);
      if (!file) return interaction.editReply("⚠️ Nenhum cartão encontrado.");
      const ch = interaction.client.channels.cache.get(
        process.env.REPORT_CHANNEL_ID,
      );
      if (ch)
        await ch.send({
          content: `📊 Relatório de busca: "${term}"`,
          files: [file],
        });
      return interaction.editReply(
        `✅ Enviado em <#${process.env.REPORT_CHANNEL_ID}>.`,
      );
    }

    // DIÁRIO (sem termo)
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("create_report")
        .setLabel("📊 Criar Relatório Diário")
        .setStyle(ButtonStyle.Primary),
    );
    await interaction.reply({
      content: "Clique para gerar relatório de hoje:",
      components: [row],
      ephemeral: true,
    });
  },
};
