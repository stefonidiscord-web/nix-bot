const { REST, Routes } = require("discord.js");
const config = require("./config");
const commands = require("./commands");

(async () => {
  const rest = new REST({ version: "10" }).setToken(config.token);
  const route = config.guildId
    ? Routes.applicationGuildCommands(config.clientId, config.guildId)
    : Routes.applicationCommands(config.clientId);
  await rest.put(route, { body: commands });
  console.log(`Zarejestrowano ${commands.length} komend.`);
})().catch(error => {
  console.error("Błąd rejestracji komend:", error);
  process.exit(1);
});
