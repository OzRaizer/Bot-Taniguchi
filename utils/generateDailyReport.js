// utils/generateDailyReport.js
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

async function generateDailyReport() {
  const key = process.env.TRELLO_KEY;
  const token = process.env.TRELLO_TOKEN;

  // Início do dia em fuso de São Paulo
  const now = new Date();
  const spStr = now.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" });
  const spNow = new Date(spStr);
  spNow.setHours(0, 0, 0, 0);

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
        const last = new Date(c.dateLastActivity);
        if (last >= spNow) {
          rows.push({
            data: last.toLocaleString("pt-BR", {
              timeZone: "America/Sao_Paulo",
            }),
            quadro: boardName,
            lista: list.name,
            cartao: c.name,
            url: c.url,
          });
        }
      }
    }
  }

  if (!rows.length) return null;

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Movimentações");
  sheet.columns = [
    { header: "Data/Hora", key: "data", width: 20 },
    { header: "Quadro", key: "quadro", width: 30 },
    { header: "Lista", key: "lista", width: 25 },
    { header: "Cartão", key: "cartao", width: 40 },
    { header: "Link", key: "url", width: 50 },
  ];
  sheet.addRows(rows);

  // nome único
  const ts = now
    .toLocaleString("sv-SE", { timeZone: "America/Sao_Paulo" })
    .replace(/[: ]/g, "-");
  const dir = path.join(__dirname, "../reports");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `dailyReport-${ts}.xlsx`);

  await workbook.xlsx.writeFile(file);
  return file;
}

module.exports = { generateDailyReport };
