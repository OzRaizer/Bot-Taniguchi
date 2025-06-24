// commands/trello.js
const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const axios = require("axios");

const BOARDS = {
  router: {
    name: "CNC Router Easynest 3018",
    id: process.env.TRELLO_BOARD_ROUTER,
  },
  evolution: {
    name: "Holzher Evolution 7405",
    id: process.env.TRELLO_BOARD_EVOLUTION,
  },
  sec1: {
    name: "Seccionadora 1",
    id: process.env.TRELLO_BOARD_SEC1,
  },
  sec2: {
    name: "Seccionadora 2",
    id: process.env.TRELLO_BOARD_SEC2,
  },
  pcp: {
    name: "Projetos / PCP",
    id: process.env.TRELLO_BOARD_PCP,
  },
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName("trello")
    .setDescription("Busca um cartão em um quadro específico do Trello")
    .addStringOption((opt) =>
      opt
        .setName("quadro")
        .setDescription("Escolha o quadro")
        .setRequired(true)
        .addChoices(
          { name: BOARDS.pcp.name, value: "pcp" },
          { name: BOARDS.router.name, value: "router" },
          { name: BOARDS.evolution.name, value: "evolution" },
          { name: BOARDS.sec1.name, value: "sec1" },
          { name: BOARDS.sec2.name, value: "sec2" },
        ),
    )
    .addStringOption((opt) =>
      opt
        .setName("cartao")
        .setDescription("Parte ou todo o nome do cartão")
        .setRequired(true),
    ),

  async execute(interaction) {
    await interaction.deferReply();

    const boardKey = interaction.options.getString("quadro");
    const termo = interaction.options.getString("cartao").toLowerCase();
    const board = BOARDS[boardKey];
    const key = process.env.TRELLO_KEY;
    const token = process.env.TRELLO_TOKEN;

    try {
      // 1) Pega todas as listas do quadro
      const { data: lists } = await axios.get(
        `https://api.trello.com/1/boards/${board.id}/lists?key=${key}&token=${token}`,
      );

      // 2) Varre cada lista em busca de cards que tenham o nome solicitado
      const encontrados = [];
      for (const list of lists) {
        const { data: cards } = await axios.get(
          `https://api.trello.com/1/lists/${list.id}/cards?key=${key}&token=${token}`,
        );
        cards.forEach((card, idx) => {
          if (card.name.toLowerCase().includes(termo)) {
            encontrados.push({
              listName: list.name,
              position: idx + 1,
              card,
            });
          }
        });
      }

      if (encontrados.length === 0) {
        return interaction.editReply(
          `❌ Não encontrei nenhum cartão em **${board.name}** contendo “${termo}”.`,
        );
      }

      // 3) Monta um embed com até 5 resultados
      const embed = new EmbedBuilder()
        .setTitle(`📋 Resultado em: ${board.name}`)
        .setColor("Green")
        .setFooter({
          text: `${encontrados.length} resultado(s) encontrado(s)`,
        });

      encontrados.slice(0, 5).forEach(({ listName, position, card }) => {
        embed.addFields({
          name: card.name,
          value: `📑 Lista: **${listName}** (posição ${position})\n🔗 [Abrir no Trello](${card.url})`,
        });
      });

      await interaction.editReply({ embeds: [embed] });
    } catch (err) {
      console.error("Erro ao buscar Trello:", err);
      await interaction.editReply("❌ Ocorreu um erro ao consultar o Trello.");
    }
  },
};
