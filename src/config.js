require("dotenv").config();

const required = ["DISCORD_TOKEN", "CLIENT_ID"];
for (const key of required) {
  if (!process.env[key]) {
    console.error(`Brakuje zmiennej ${key}. Uzupełnij ją w .env / Render Environment.`);
    process.exit(1);
  }
}

module.exports = {
  token: process.env.DISCORD_TOKEN,
  clientId: process.env.CLIENT_ID,
  guildId: process.env.GUILD_ID || null,
  port: Number(process.env.PORT || 3000)
};
