const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const axios = require("axios");

const BOARDS = {
  pcp: process.env.TRELLO_BOARD_PCP,
  router: process.env.TRELLO_BOARD_ROUTER,
  evolution: process.env.TRELLO_BOARD_EVOLUTION,
  sec1: process.env.TRELLO_BOARD_SEC1,
  sec2: process.env.TRELLO_BOARD_SEC2,
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName("projeto")
    .setDescription("Busca status de um projeto pelo nome ou lista geral")
    .addStringOption((opt) =>
      opt.setName("nome").setDescription("Parte do nome do cartão (opcional)"),
    ),
  async execute(interaction) {
    await interaction.deferReply();

    const termo = interaction.options.getString("nome");
    const key = process.env.TRELLO_KEY;
    const token = process.env.TRELLO_TOKEN;
    const resultados = [];

    // Função para buscar em um board
    async function buscaEmBoard(boardKey, boardName) {
      const lists = await axios
        .get(
          `https://api.trello.com/1/boards/${boardKey}/lists?key=${key}&token=${token}`,
        )
        .then((r) => r.data);

      for (const list of lists) {
        const cards = await axios
          .get(
            `https://api.trello.com/1/lists/${list.id}/cards?key=${key}&token=${token}`,
          )
          .then((r) => r.data);

        for (const card of cards) {
          if (!termo || card.name.toLowerCase().includes(termo.toLowerCase())) {
            resultados.push({
              board: boardName,
              list: list.name,
              name: card.name,
              url: card.url,
            });
          }
        }
      }
    }

    // Busca em todos
    await Promise.all([
      buscaEmBoard(BOARDS.pcp, "Projetos/PCP"),
      buscaEmBoard(BOARDS.router, "CNC Router Easynest"),
      buscaEmBoard(BOARDS.evolution, "Holzher Evolution"),
      buscaEmBoard(BOARDS.sec1, "Seccionadora 1"),
      buscaEmBoard(BOARDS.sec2, "Seccionadora 2"),
    ]);

    if (resultados.length === 0) {
      return interaction.editReply("❌ Nenhum projeto encontrado.");
    }

    // Monta embed resumido (até 5 itens, o resto em contagem)
    const embed = new EmbedBuilder()
      .setTitle(
        termo
          ? `Status de projetos contendo "${termo}"`
          : "Status de todos os projetos",
      )
      .setColor("Green");

    resultados.slice(0, 5).forEach((r) => {
      embed.addFields({
        name: `${r.name}`,
        value: `📋 Board: **${r.board}**\n🔄 Lista: **${r.list}**\n🔗 [Abrir no Trello](${r.url})`,
      });
    });

    if (resultados.length > 5) {
      embed.setFooter({ text: `…e mais ${resultados.length - 5} resultados` });
    }

    await interaction.editReply({ embeds: [embed] });
  },
};
