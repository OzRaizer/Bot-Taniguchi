require("dotenv").config();
const fs = require("fs");
const { Client, Collection, GatewayIntentBits } = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.commands = new Collection();
for (const f of fs.readdirSync("./commands").filter((f) => f.endsWith(".js"))) {
  const cmd = require(`./commands/${f}`);
  if (cmd.data && cmd.execute) client.commands.set(cmd.data.name, cmd);
}

for (const f of fs.readdirSync("./events").filter((f) => f.endsWith(".js"))) {
  const ev = require(`./events/${f}`);
  if (ev.once) client.once(ev.name, (...a) => ev.execute(...a));
  else client.on(ev.name, (...a) => ev.execute(...a));
}

client.login(process.env.DISCORD_TOKEN);
