// utils/generateSearchReport.js
const ExcelJS = require("exceljs");
const axios = require("axios");
const path = require("path");
const fs = require("fs");

const BOARDS = {
  pcp: { name: "Projetos / PCP", id: process.env.TRELLO_BOARD_PCP },
  router: {
    name: "CNC Router Easynest 3018",
    id: process.env.TRELLO_BOARD_ROUTER,
  },
  evolution: {
    name: "Holzher Evolution 7405",
    id: process.env.TRELLO_BOARD_EVOLUTION,
  },
  sec1: { name: "Seccionadora 1", id: process.env.TRELLO_BOARD_SEC1 },
  sec2: { name: "Seccionadora 2", id: process.env.TRELLO_BOARD_SEC2 },
};

// extrai data de criação do ID do card
function getCreationDate(id) {
  return new Date(parseInt(id.substring(0, 8), 16) * 1000);
}

async function generateSearchReport(term) {
  const key = process.env.TRELLO_KEY;
  const token = process.env.TRELLO_TOKEN;
  const rows = [];

  for (const { name: boardName, id: boardId } of Object.values(BOARDS)) {
    const lists = (
      await axios.get(
        `https://api.trello.com/1/boards/${boardId}/lists?key=${key}&token=${token}`,
      )
    ).data;
    for (const list of lists) {
      const cards = (
        await axios.get(
          `https://api.trello.com/1/lists/${list.id}/cards?key=${key}&token=${token}`,
        )
      ).data;
      for (const c of cards) {
        if (c.name.toLowerCase().includes(term.toLowerCase())) {
          const created = getCreationDate(c.id);
          const last = new Date(c.dateLastActivity);
          rows.push({
            board: boardName,
            list: list.name,
            card: c,
            created,
            last,
          });
        }
      }
    }
  }

  if (!rows.length) return null;

  const wb = new ExcelJS.Workbook();
  const sheet1 = wb.addWorksheet("Detalhes");
  sheet1.columns = [
    { header: "Quadro", key: "board", width: 30 },
    { header: "Lista", key: "list", width: 25 },
    { header: "Cartão", key: "name", width: 40 },
    { header: "Criado em", key: "created", width: 20 },
    { header: "Última Ativ.", key: "last", width: 20 },
    { header: "Dias em Ativ.", key: "days", width: 12 },
    { header: "Horas em Ativ.", key: "hours", width: 12 },
    { header: "Minutos em Ativ.", key: "mins", width: 12 },
    { header: "Link", key: "url", width: 50 },
  ];

  rows.forEach((r) => {
    const ms = r.last - r.created;
    const days = Math.floor(ms / 86400000);
    const hours = Math.floor((ms % 86400000) / 3600000);
    const mins = Math.floor((ms % 3600000) / 60000);
    sheet1.addRow({
      board: r.board,
      list: r.list,
      name: r.card.name,
      created: r.created.toLocaleString("pt-BR", {
        timeZone: "America/Sao_Paulo",
      }),
      last: r.last.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }),
      days,
      hours,
      mins,
      url: r.card.url,
    });
  });

  const sheet2 = wb.addWorksheet("Resumo");
  sheet2.columns = [{ header: "Resumo", key: "text", width: 100 }];
  rows.forEach((r) => {
    const ms = r.last - r.created;
    const days = Math.floor(ms / 86400000);
    const hours = Math.floor((ms % 86400000) / 3600000);
    const mins = Math.floor((ms % 3600000) / 60000);
    sheet2.addRow({
      text: `O cartão "${r.card.name}" foi criado em ${r.created.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })} e teve última atividade em ${r.last.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}, ficando ativo por ${days}d, ${hours}h e ${mins}m.`,
    });
  });

  // salva
  const now = new Date();
  const ts = now.toISOString().replace(/[:]/g, "-");
  const dir = path.join(__dirname, "../reports");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `searchReport-${term}-${ts}.xlsx`);
  await wb.xlsx.writeFile(file);
  return file;
}

module.exports = { generateSearchReport };
