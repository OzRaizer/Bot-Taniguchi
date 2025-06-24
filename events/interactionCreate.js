// events/interactionCreate.js
const createTicketChannel = require("../utils/createTicketChannel");
const { generateDailyReport } = require("../utils/generateDailyReport");
const { generateSearchReport } = require("../utils/generateSearchReport");
const { PermissionFlagsBits } = require("discord.js");

module.exports = {
  name: "interactionCreate",
  async execute(interaction) {
    if (interaction.isChatInputCommand()) {
      const cmd = interaction.client.commands.get(interaction.commandName);
      if (!cmd) return;
      try {
        await cmd.execute(interaction);
      } catch (e) {
        console.error(e);
        return interaction.reply({
          content: "❌ Erro interno.",
          ephemeral: true,
        });
      }
      return;
    }

    if (!interaction.isButton()) return;
    const id = interaction.customId;

    // relatório diário
    if (id === "create_report") {
      await interaction.deferReply({ ephemeral: true });
      const f = await generateDailyReport();
      if (!f) return interaction.editReply("⚠️ Sem movimentações hoje.");
      await interaction.client.channels.cache
        .get(process.env.REPORT_CHANNEL_ID)
        .send({ content: "📊 Relatório diário:", files: [f] });
      return interaction.editReply("✅ Enviado.");
    }

    // fechar ticket
    if (id === "fechar_ticket") {
      await interaction.reply({ content: "🔒 Fechando...", ephemeral: true });
      const logs = interaction.guild.channels.cache.find(
        (c) => c.name === "ticket-logs",
      );
      if (logs)
        logs.send(
          `✅ Fechado ${interaction.channel.name} por ${interaction.user.tag}`,
        );
      return setTimeout(() => interaction.channel.delete(), 2000);
    }

    // 2.3 – Dúvida: IA vs Humano
    if (id === "start_ai") {
      // ativa somente IA
      await interaction.channel.setTopic("AI_CHAT");
      return interaction.reply({
        content:
          "🤖 **Chat AI ativado!** Poste sua dúvida aqui, que eu responderei.",
        ephemeral: true,
      });
    }

    if (id === "call_human") {
      // ativa somente humano
      await interaction.channel.setTopic("HUMAN_SUPPORT");
      const role = interaction.guild.roles.cache.get(
        process.env.SUPPORT_ROLE_ID,
      );
      await interaction.channel.send(
        role
          ? `${role} alguém solicitou atendimento humano aqui!`
          : "👤 Suporte humano solicitado!",
      );
      return interaction.reply({
        content:
          "👤 Equipe humana foi notificada e a IA foi desativada neste canal.",
        ephemeral: true,
      });
    }

    // status
    if (["status_resolved", "status_unresolved"].includes(id)) {
      const msg =
        id === "status_resolved" ? "🎉 Resolvido!" : "⚠️ Não Resolvido!";
      return interaction.reply({ content: msg, ephemeral: true });
    }

    // ticket
    if (id.endsWith("_ticket")) {
      try {
        await createTicketChannel(interaction, id);
      } catch (e) {
        console.error(e);
        return interaction.reply({
          content: "❌ Erro criando ticket.",
          ephemeral: true,
        });
      }
    }
  },
};
