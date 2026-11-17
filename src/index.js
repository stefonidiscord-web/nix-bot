const express = require("express");
const {
  Client, GatewayIntentBits, Partials, Events, REST, Routes,
  ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder,
  ChannelType, PermissionFlagsBits, ModalBuilder, TextInputBuilder,
  TextInputStyle
} = require("discord.js");

const config = require("./config");
const commands = require("./commands");
const store = require("./store");

const app = express();
app.get("/", (_req, res) => res.send("Discord bot is running."));
app.get("/health", (_req, res) => res.json({ ok: true, service: "discord-bot" }));
app.listen(config.port, "0.0.0.0", () => console.log(`HTTP health server: ${config.port}`));

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
  partials: [Partials.Channel]
});

const captchaSessions = new Map();
const ticketOwners = new Map();

const makeId = (prefix, value) => `${prefix}:${value}`;

async function registerCommands() {
  const rest = new REST({ version: "10" }).setToken(config.token);
  const route = config.guildId
    ? Routes.applicationGuildCommands(config.clientId, config.guildId)
    : Routes.applicationCommands(config.clientId);
  await rest.put(route, { body: commands });
}

client.once(Events.ClientReady, async c => {
  console.log(`Zalogowano jako ${c.user.tag}`);
  try { await registerCommands(); console.log("Komendy slash zarejestrowane."); }
  catch (e) { console.error("Nie udało się zarejestrować komend:", e); }
});

client.on(Events.GuildMemberAdd, async member => {
  const settings = store.read();
  if (!settings.welcome?.channelId) return;
  const channel = await member.guild.channels.fetch(settings.welcome.channelId).catch(() => null);
  if (!channel?.isTextBased()) return;
  const content = settings.welcome.message
    .replaceAll("{user}", `<@${member.id}>`)
    .replaceAll("{server}", member.guild.name);
  channel.send({ content }).catch(console.error);
});

client.on(Events.InteractionCreate, async interaction => {
  try {
    if (interaction.isChatInputCommand()) {
      if (interaction.commandName === "ticket-panel") {
        const embed = new EmbedBuilder().setColor(0x2878ff).setTitle("Centrum pomocy")
          .setDescription("Kliknij przycisk poniżej, aby otworzyć prywatny ticket.");
        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId("ticket:open").setLabel("Otwórz ticket").setStyle(ButtonStyle.Primary).setEmoji("🎫")
        );
        return interaction.reply({ embeds: [embed], components: [row] });
      }

      if (interaction.commandName === "verify-panel") {
        const role = interaction.options.getRole("rola");
        store.update(s => { s.verifyRoleId = role.id; });
        const embed = new EmbedBuilder().setColor(0x22c55e).setTitle("Weryfikacja CAPTCHA")
          .setDescription("Kliknij przycisk i rozwiąż krótkie działanie, aby otrzymać rolę.");
        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId("verify:start").setLabel("Rozpocznij weryfikację").setStyle(ButtonStyle.Success)
        );
        return interaction.reply({ embeds: [embed], components: [row] });
      }

      if (interaction.commandName === "welcome-set") {
        const channel = interaction.options.getChannel("kanal");
        const message = interaction.options.getString("tekst");
        store.update(s => { s.welcome = { channelId: channel.id, message }; });
        return interaction.reply({ content: `Powitania ustawione na ${channel}.`, ephemeral: true });
      }

      if (interaction.commandName === "say") {
        const text = interaction.options.getString("tekst");
        const asEmbed = interaction.options.getBoolean("embed") ?? false;
        if (asEmbed) {
          await interaction.channel.send({ embeds: [new EmbedBuilder().setColor(0x2878ff).setDescription(text)] });
        } else {
          await interaction.channel.send({ content: text, allowedMentions: { parse: [] } });
        }
        return interaction.reply({ content: "Wiadomość wysłana.", ephemeral: true });
      }

      if (interaction.commandName === "self-role") {
        const sub = interaction.options.getSubcommand();
        const role = interaction.options.getRole("rola");
        if (role.managed || role.id === interaction.guild.id) {
          return interaction.reply({ content: "Tej roli nie można użyć w self-role.", ephemeral: true });
        }
        if (sub === "dodaj") {
          const label = interaction.options.getString("etykieta");
          store.update(s => {
            if (!s.selfRoles.some(r => r.roleId === role.id)) s.selfRoles.push({ roleId: role.id, label });
            else s.selfRoles = s.selfRoles.map(r => r.roleId === role.id ? { ...r, label } : r);
          });
          const settings = store.read();
          const row = new ActionRowBuilder().addComponents(settings.selfRoles.slice(0, 5).map(r =>
            new ButtonBuilder().setCustomId(makeId("selfrole", r.roleId)).setLabel(r.label).setStyle(ButtonStyle.Secondary)
          ));
          await interaction.channel.send({
            embeds: [new EmbedBuilder().setColor(0x2878ff).setTitle("Wybierz swoje role").setDescription("Kliknij przycisk, aby otrzymać lub odebrać rolę.")],
            components: [row]
          });
          return interaction.reply({ content: `Dodano ${role} do panelu self-role.`, ephemeral: true });
        }
        store.update(s => { s.selfRoles = s.selfRoles.filter(r => r.roleId !== role.id); });
        return interaction.reply({ content: `Usunięto ${role} z konfiguracji self-role. Stare przyciski przestaną działać.`, ephemeral: true });
      }

      // Dodatkowe 25 komend
      if (interaction.commandName === "ping") {
        return interaction.reply({ content: `Pong! Opóźnienie API: ${Math.round(client.ws.ping)} ms.`, ephemeral: true });
      }
      if (interaction.commandName === "help") {
        const sections = [
          "**Informacyjne:** `/ping`, `/help`, `/userinfo`, `/serverinfo`, `/avatar`, `/membercount`, `/servericon`",
          "**Moderacja:** `/clear`, `/slowmode`, `/lock`, `/unlock`, `/kick`, `/ban`, `/unban`, `/timeout`, `/untimeout`, `/warn`, `/warnings`, `/clear-warnings`",
          "**Role i publikowanie:** `/role-add`, `/role-remove`, `/nick`, `/announce`, `/embed`, `/poll`",
          "**Systemy:** `/ticket-panel`, `/verify-panel`, `/welcome-set`, `/say`, `/self-role dodaj`, `/self-role usun`"
        ];
        return interaction.reply({ embeds: [new EmbedBuilder().setColor(0x2878ff).setTitle("Lista komend").setDescription(sections.join("\\n"))], ephemeral: true });
      }
      if (interaction.commandName === "userinfo") {
        const user = interaction.options.getUser("uzytkownik") || interaction.user;
        const member = await interaction.guild.members.fetch(user.id).catch(() => null);
        const embed = new EmbedBuilder().setColor(0x2878ff).setTitle(`Użytkownik: ${user.tag}`)
          .setThumbnail(user.displayAvatarURL({ size: 256 }))
          .addFields(
            { name: "ID", value: user.id, inline: true },
            { name: "Konto utworzone", value: `<t:${Math.floor(user.createdTimestamp / 1000)}:R>`, inline: true },
            { name: "Dołączył", value: member?.joinedTimestamp ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>` : "Brak danych", inline: true }
          );
        return interaction.reply({ embeds: [embed], ephemeral: true });
      }
      if (interaction.commandName === "serverinfo") {
        const g = interaction.guild;
        const embed = new EmbedBuilder().setColor(0x2878ff).setTitle(g.name)
          .setThumbnail(g.iconURL({ size: 256 }))
          .addFields(
            { name: "ID", value: g.id, inline: true },
            { name: "Właściciel", value: `<@${g.ownerId}>`, inline: true },
            { name: "Członkowie", value: String(g.memberCount), inline: true },
            { name: "Utworzono", value: `<t:${Math.floor(g.createdTimestamp / 1000)}:D>`, inline: true }
          );
        return interaction.reply({ embeds: [embed], ephemeral: true });
      }
      if (interaction.commandName === "avatar") {
        const user = interaction.options.getUser("uzytkownik") || interaction.user;
        const url = user.displayAvatarURL({ size: 1024 });
        return interaction.reply({ embeds: [new EmbedBuilder().setColor(0x2878ff).setTitle(`Avatar: ${user.tag}`).setImage(url).setURL(url)] });
      }
      if (interaction.commandName === "membercount") {
        return interaction.reply({ content: `Na serwerze **${interaction.guild.memberCount}** członków.` });
      }
      if (interaction.commandName === "servericon") {
        const url = interaction.guild.iconURL({ size: 1024 });
        if (!url) return interaction.reply({ content: "Ten serwer nie ma ustawionej ikony.", ephemeral: true });
        return interaction.reply({ embeds: [new EmbedBuilder().setColor(0x2878ff).setTitle("Ikona serwera").setImage(url)] });
      }
      if (interaction.commandName === "poll") {
        const question = interaction.options.getString("pytanie");
        const options = [interaction.options.getString("opcja1"), interaction.options.getString("opcja2"), interaction.options.getString("opcja3")].filter(Boolean);
        const emojis = ["1️⃣", "2️⃣", "3️⃣"];
        const embed = new EmbedBuilder().setColor(0x2878ff).setTitle("📊 " + question)
          .setDescription(options.map((v, i) => `${emojis[i]} ${v}`).join("\\n"))
          .setFooter({ text: `Ankieta od ${interaction.user.tag}` });
        const msg = await interaction.channel.send({ embeds: [embed] });
        for (let i = 0; i < options.length; i++) await msg.react(emojis[i]);
        return interaction.reply({ content: "Ankieta została opublikowana.", ephemeral: true });
      }
      if (interaction.commandName === "clear") {
        const amount = interaction.options.getInteger("ilosc");
        const deleted = await interaction.channel.bulkDelete(amount, true);
        return interaction.reply({ content: `Usunięto ${deleted.size} wiadomości. Discord pomija wiadomości starsze niż 14 dni.`, ephemeral: true });
      }
      if (interaction.commandName === "slowmode") {
        const seconds = interaction.options.getInteger("sekundy");
        await interaction.channel.setRateLimitPerUser(seconds);
        return interaction.reply({ content: seconds ? `Ustawiono slowmode: ${seconds} s.` : "Wyłączono slowmode.", ephemeral: true });
      }
      if (interaction.commandName === "lock" || interaction.commandName === "unlock") {
        const locked = interaction.commandName === "lock";
        await interaction.channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: locked ? false : null });
        return interaction.reply({ content: locked ? "🔒 Kanał został zablokowany." : "🔓 Kanał został odblokowany." });
      }
      if (interaction.commandName === "kick" || interaction.commandName === "ban") {
        const user = interaction.options.getUser("uzytkownik");
        const reason = interaction.options.getString("powod") || `Akcja moderatora: ${interaction.user.tag}`;
        const member = await interaction.guild.members.fetch(user.id).catch(() => null);
        if (!member) return interaction.reply({ content: "Nie znaleziono członka na serwerze.", ephemeral: true });
        if (member.id === interaction.user.id || member.id === client.user.id) return interaction.reply({ content: "Nie możesz wykonać tej akcji wobec tego użytkownika.", ephemeral: true });
        if (interaction.commandName === "kick") await member.kick(reason);
        else await member.ban({ reason });
        return interaction.reply({ content: `Wykonano **${interaction.commandName}** dla ${user.tag}. Powód: ${reason}` });
      }
      if (interaction.commandName === "unban") {
        const id = interaction.options.getString("id").trim();
        if (!/^\\d{17,20}$/.test(id)) return interaction.reply({ content: "Podaj poprawne ID użytkownika.", ephemeral: true });
        await interaction.guild.members.unban(id, `Odbanował ${interaction.user.tag}`);
        return interaction.reply({ content: `Odbanowano użytkownika o ID ${id}.` });
      }
      if (interaction.commandName === "timeout" || interaction.commandName === "untimeout") {
        const user = interaction.options.getUser("uzytkownik");
        const member = await interaction.guild.members.fetch(user.id).catch(() => null);
        if (!member) return interaction.reply({ content: "Nie znaleziono członka.", ephemeral: true });
        if (member.id === interaction.user.id || member.id === client.user.id) return interaction.reply({ content: "Nie możesz wykonać tej akcji wobec tego użytkownika.", ephemeral: true });
        if (interaction.commandName === "timeout") {
          const mins = interaction.options.getInteger("minuty");
          const reason = interaction.options.getString("powod") || `Timeout od ${interaction.user.tag}`;
          await member.timeout(mins * 60 * 1000, reason);
          return interaction.reply({ content: `Użytkownik ${user.tag} otrzymał timeout na ${mins} min.` });
        }
        await member.timeout(null, `Timeout zdjęty przez ${interaction.user.tag}`);
        return interaction.reply({ content: `Zdjęto timeout użytkownikowi ${user.tag}.` });
      }
      if (interaction.commandName === "warn") {
        const user = interaction.options.getUser("uzytkownik");
        const reason = interaction.options.getString("powod");
        store.update(data => {
          data.warnings ||= {};
          data.warnings[`${interaction.guild.id}:${user.id}`] ||= [];
          data.warnings[`${interaction.guild.id}:${user.id}`].push({ reason, moderatorId: interaction.user.id, at: Date.now() });
        });
        return interaction.reply({ content: `⚠️ ${user.tag} otrzymał ostrzeżenie. Powód: ${reason}` });
      }
      if (interaction.commandName === "warnings") {
        const user = interaction.options.getUser("uzytkownik");
        const list = store.read().warnings?.[`${interaction.guild.id}:${user.id}`] || [];
        const desc = list.length ? list.map((w, i) => `**${i + 1}.** ${w.reason} — <@${w.moderatorId}> (<t:${Math.floor(w.at / 1000)}:d>)`).join("\\n") : "Brak ostrzeżeń.";
        return interaction.reply({ embeds: [new EmbedBuilder().setColor(0xf59e0b).setTitle(`Ostrzeżenia: ${user.tag}`).setDescription(desc.slice(0, 4000))], ephemeral: true });
      }
      if (interaction.commandName === "clear-warnings") {
        const user = interaction.options.getUser("uzytkownik");
        store.update(data => { data.warnings ||= {}; delete data.warnings[`${interaction.guild.id}:${user.id}`]; });
        return interaction.reply({ content: `Usunięto ostrzeżenia użytkownika ${user.tag}.`, ephemeral: true });
      }
      if (interaction.commandName === "role-add" || interaction.commandName === "role-remove") {
        const user = interaction.options.getUser("uzytkownik");
        const role = interaction.options.getRole("rola");
        const member = await interaction.guild.members.fetch(user.id).catch(() => null);
        const botTop = interaction.guild.members.me.roles.highest;
        if (!member) return interaction.reply({ content: "Nie znaleziono członka.", ephemeral: true });
        if (role.managed || role.position >= botTop.position || role.id === interaction.guild.id) return interaction.reply({ content: "Bot nie ma wystarczającej pozycji, aby zarządzać tą rolą.", ephemeral: true });
        if (interaction.commandName === "role-add") await member.roles.add(role);
        else await member.roles.remove(role);
        return interaction.reply({ content: `${interaction.commandName === "role-add" ? "Nadano" : "Odebrano"} rolę ${role} użytkownikowi ${user.tag}.` });
      }
      if (interaction.commandName === "nick") {
        const user = interaction.options.getUser("uzytkownik");
        const nickname = interaction.options.getString("nazwa");
        const member = await interaction.guild.members.fetch(user.id).catch(() => null);
        if (!member) return interaction.reply({ content: "Nie znaleziono członka.", ephemeral: true });
        await member.setNickname(nickname, `Zmiana przez ${interaction.user.tag}`);
        return interaction.reply({ content: nickname ? `Zmieniono pseudonim ${user.tag}.` : `Usunięto pseudonim ${user.tag}.` });
      }
      if (interaction.commandName === "announce") {
        const channel = interaction.options.getChannel("kanal");
        const content = interaction.options.getString("tresc");
        await channel.send({ content, allowedMentions: { parse: [] } });
        return interaction.reply({ content: `Ogłoszenie wysłane na ${channel}.`, ephemeral: true });
      }
      if (interaction.commandName === "embed") {
        const title = interaction.options.getString("tytul");
        const description = interaction.options.getString("opis");
        await interaction.channel.send({ embeds: [new EmbedBuilder().setColor(0x2878ff).setTitle(title).setDescription(description)] });
        return interaction.reply({ content: "Embed wysłany.", ephemeral: true });
      }
    }

    if (interaction.isButton()) {
      if (interaction.customId === "ticket:open") {
        const existing = interaction.guild.channels.cache.find(c =>
          c.type === ChannelType.GuildText && c.topic === `ticket-owner:${interaction.user.id}`
        );
        if (existing) return interaction.reply({ content: `Masz już otwarty ticket: ${existing}`, ephemeral: true });

        const channel = await interaction.guild.channels.create({
          name: `ticket-${interaction.user.username}`.toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 90),
          type: ChannelType.GuildText,
          topic: `ticket-owner:${interaction.user.id}`,
          permissionOverwrites: [
            { id: interaction.guild.id, deny: [PermissionFlagsBits.ViewChannel] },
            { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] },
            { id: client.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageChannels, PermissionFlagsBits.ReadMessageHistory] }
          ]
        });
        ticketOwners.set(channel.id, interaction.user.id);
        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId("ticket:close").setLabel("Zamknij ticket").setStyle(ButtonStyle.Secondary),
          new ButtonBuilder().setCustomId("ticket:delete").setLabel("Usuń ticket").setStyle(ButtonStyle.Danger)
        );
        await channel.send({ content: `${interaction.user} witaj! Opisz swój problem.`, components: [row] });
        return interaction.reply({ content: `Utworzono ticket: ${channel}`, ephemeral: true });
      }

      if (interaction.customId === "ticket:close") {
        const ownerId = ticketOwners.get(interaction.channel.id) ||
          interaction.channel.topic?.replace("ticket-owner:", "");
        if (interaction.user.id !== ownerId && !interaction.memberPermissions.has(PermissionFlagsBits.ManageChannels)) {
          return interaction.reply({ content: "Tylko autor ticketu lub moderator może go zamknąć.", ephemeral: true });
        }
        await interaction.channel.permissionOverwrites.edit(ownerId, { SendMessages: false });
        return interaction.reply({ content: "Ticket został zamknięty. Moderator może go usunąć przyciskiem poniżej.", ephemeral: false });
      }

      if (interaction.customId === "ticket:delete") {
        if (!interaction.memberPermissions.has(PermissionFlagsBits.ManageChannels)) {
          return interaction.reply({ content: "Usuwanie ticketów jest dostępne dla moderatorów.", ephemeral: true });
        }
        await interaction.reply({ content: "Usuwam ticket za 3 sekundy." });
        setTimeout(() => interaction.channel.delete().catch(() => {}), 3000);
        return;
      }

      if (interaction.customId === "verify:start") {
        const a = Math.floor(Math.random() * 8) + 2;
        const b = Math.floor(Math.random() * 8) + 2;
        const answer = String(a + b);
        captchaSessions.set(interaction.user.id, { answer, expires: Date.now() + 120000 });
        const modal = new ModalBuilder().setCustomId("verify:answer").setTitle("Weryfikacja CAPTCHA");
        const input = new TextInputBuilder().setCustomId("answer").setLabel(`Ile wynosi ${a} + ${b}?`)
          .setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(3);
        modal.addComponents(new ActionRowBuilder().addComponents(input));
        return interaction.showModal(modal);
      }

      if (interaction.customId.startsWith("selfrole:")) {
        const roleId = interaction.customId.split(":")[1];
        const settings = store.read();
        if (!settings.selfRoles.some(r => r.roleId === roleId)) {
          return interaction.reply({ content: "Ta rola nie jest już dostępna.", ephemeral: true });
        }
        const role = interaction.guild.roles.cache.get(roleId);
        if (!role || role.managed || role.position >= interaction.guild.members.me.roles.highest.position) {
          return interaction.reply({ content: "Bot nie może zarządzać tą rolą. Przenieś jego rolę wyżej.", ephemeral: true });
        }
        const member = await interaction.guild.members.fetch(interaction.user.id);
        if (member.roles.cache.has(roleId)) {
          await member.roles.remove(roleId);
          return interaction.reply({ content: `Odebrano rolę **${role.name}**.`, ephemeral: true });
        }
        await member.roles.add(roleId);
        return interaction.reply({ content: `Nadano rolę **${role.name}**.`, ephemeral: true });
      }
    }

    if (interaction.isModalSubmit() && interaction.customId === "verify:answer") {
      const session = captchaSessions.get(interaction.user.id);
      captchaSessions.delete(interaction.user.id);
      if (!session || session.expires < Date.now() || interaction.fields.getTextInputValue("answer").trim() !== session.answer) {
        return interaction.reply({ content: "Niepoprawna lub wygasła odpowiedź. Uruchom CAPTCHA ponownie.", ephemeral: true });
      }
      const roleId = store.read().verifyRoleId;
      const role = roleId && interaction.guild.roles.cache.get(roleId);
      if (!role) return interaction.reply({ content: "Rola weryfikacyjna nie jest ustawiona lub nie istnieje.", ephemeral: true });
      const member = await interaction.guild.members.fetch(interaction.user.id);
      await member.roles.add(role);
      return interaction.reply({ content: `Weryfikacja zakończona! Otrzymujesz rolę **${role.name}**.`, ephemeral: true });
    }
  } catch (error) {
    console.error("Błąd interakcji:", error);
    const payload = { content: "Wystąpił błąd. Sprawdź uprawnienia bota i konfigurację.", ephemeral: true };
    if (interaction.deferred || interaction.replied) await interaction.followUp(payload).catch(() => {});
    else await interaction.reply(payload).catch(() => {});
  }
});

process.on("unhandledRejection", error => console.error("Unhandled rejection:", error));
client.login(config.token);
