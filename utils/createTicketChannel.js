// utils/createTicketChannel.js
const {
  ChannelType,
  PermissionFlagsBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");

module.exports = async function createTicketChannel(interaction, customId) {
  const categoria = customId.replace("_ticket", "");
  const nomeCanal = `ticket-${categoria}-${interaction.user.username}`
    .toLowerCase()
    .replace(/\s+/g, "-");

  if (interaction.guild.channels.cache.some((c) => c.name === nomeCanal)) {
    return interaction.reply({
      content: "❗ Você já possui um ticket aberto.",
      ephemeral: true,
    });
  }

  const canal = await interaction.guild.channels.create({
    name: nomeCanal,
    type: ChannelType.GuildText,
    permissionOverwrites: [
      {
        id: interaction.guild.roles.everyone.id,
        deny: [PermissionFlagsBits.ViewChannel],
      },
      {
        id: interaction.user.id,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ReadMessageHistory,
        ],
      },
      {
        id: interaction.client.user.id,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ManageChannels,
        ],
      },
    ],
  });

  // Mensagens iniciais por categoria...
  if (categoria === "pedido") {
    await canal.send(
      "🔎 Use `/trello `quadro` cartão` para consultar os pedidos aqui.",
    );
  } else if (categoria === "duvida") {
    const optRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("start_ai")
        .setLabel("🤖 Chat AI")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId("call_human")
        .setLabel("👤 Suporte Humano")
        .setStyle(ButtonStyle.Secondary),
    );
    await canal.send({
      content: "❓ Escolha: IA ou Suporte Humano?",
      components: [optRow],
    });
  } else if (categoria === "sugestao") {
    await canal.send(
      "💡 Digite sua sugestão ou feedback para melhorar nossa marcenaria.",
    );
  } else if (categoria === "problema") {
    await canal.send(
      "🚨 Descreva o problema que você está enfrentando para que possamos ajudar.",
    );
  }

  // Botão de fechar
  const closeRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("fechar_ticket")
      .setLabel("🛑 Fechar Ticket")
      .setStyle(ButtonStyle.Danger),
  );
  await canal.send({ components: [closeRow] });

  // Botões de status
  const statusRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("status_resolved")
      .setLabel("✅ Resolvido")
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId("status_unresolved")
      .setLabel("❌ Não Resolvido")
      .setStyle(ButtonStyle.Secondary),
  );
  await canal.send({
    content: "📌 Marque o status deste ticket:",
    components: [statusRow],
  });

  // Confirmação ao usuário
  await interaction.reply({
    content: `✅ Ticket criado: <#${canal.id}>`,
    ephemeral: true,
  });

  // Log de abertura
  const logs = interaction.guild.channels.cache.find(
    (c) => c.name === "ticket-logs",
  );
  if (logs) {
    logs.send(
      `🆕 Ticket **${categoria}** aberto por ${interaction.user.tag} em <#${canal.id}>`,
    );
  }
};
