const {
  SlashCommandBuilder, PermissionFlagsBits, ChannelType
} = require("discord.js");

module.exports = [
  new SlashCommandBuilder()
    .setName("ticket-panel").setDescription("Wyślij panel do otwierania ticketów")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  new SlashCommandBuilder()
    .setName("verify-panel").setDescription("Wyślij panel weryfikacji CAPTCHA")
    .addRoleOption(o => o.setName("rola").setDescription("Rola nadawana po weryfikacji").setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  new SlashCommandBuilder()
    .setName("welcome-set").setDescription("Ustaw powitania")
    .addChannelOption(o => o.setName("kanal").setDescription("Kanał powitań").addChannelTypes(ChannelType.GuildText).setRequired(true))
    .addStringOption(o => o.setName("tekst").setDescription("Tekst; zmienne: {user}, {server}").setRequired(true).setMaxLength(1000))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  new SlashCommandBuilder()
    .setName("say").setDescription("Wyślij wiadomość jako bot")
    .addStringOption(o => o.setName("tekst").setDescription("Treść wiadomości").setRequired(true).setMaxLength(2000))
    .addBooleanOption(o => o.setName("embed").setDescription("Wyślij jako embed").setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  new SlashCommandBuilder()
    .setName("self-role").setDescription("Zarządzaj przyciskami self-role")
    .addSubcommand(s => s.setName("dodaj").setDescription("Dodaj przycisk roli do panelu")
      .addRoleOption(o => o.setName("rola").setDescription("Rola do nadawania").setRequired(true))
      .addStringOption(o => o.setName("etykieta").setDescription("Tekst przycisku").setRequired(true).setMaxLength(80)))
    .addSubcommand(s => s.setName("usun").setDescription("Usuń rolę z panelu")
      .addRoleOption(o => o.setName("rola").setDescription("Rola do usunięcia").setRequired(true)))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
  ,
  new SlashCommandBuilder().setName("ping").setDescription("Sprawdź opóźnienie bota"),
  new SlashCommandBuilder().setName("help").setDescription("Pokaż listę komend"),
  new SlashCommandBuilder().setName("userinfo").setDescription("Informacje o użytkowniku")
    .addUserOption(o => o.setName("uzytkownik").setDescription("Wybrany użytkownik")),
  new SlashCommandBuilder().setName("serverinfo").setDescription("Informacje o serwerze"),
  new SlashCommandBuilder().setName("avatar").setDescription("Pokaż avatar użytkownika")
    .addUserOption(o => o.setName("uzytkownik").setDescription("Wybrany użytkownik")),
  new SlashCommandBuilder().setName("membercount").setDescription("Pokaż liczbę członków"),
  new SlashCommandBuilder().setName("servericon").setDescription("Pokaż ikonę serwera"),
  new SlashCommandBuilder().setName("poll").setDescription("Utwórz ankietę")
    .addStringOption(o => o.setName("pytanie").setDescription("Pytanie ankiety").setRequired(true).setMaxLength(250))
    .addStringOption(o => o.setName("opcja1").setDescription("Pierwsza opcja").setRequired(true).setMaxLength(80))
    .addStringOption(o => o.setName("opcja2").setDescription("Druga opcja").setRequired(true).setMaxLength(80))
    .addStringOption(o => o.setName("opcja3").setDescription("Trzecia opcja (opcjonalna)").setMaxLength(80)),
  new SlashCommandBuilder().setName("clear").setDescription("Usuń wiadomości z kanału")
    .addIntegerOption(o => o.setName("ilosc").setDescription("Liczba wiadomości 1-100").setRequired(true).setMinValue(1).setMaxValue(100))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
  new SlashCommandBuilder().setName("slowmode").setDescription("Ustaw wolny tryb kanału")
    .addIntegerOption(o => o.setName("sekundy").setDescription("0-21600 sekund").setRequired(true).setMinValue(0).setMaxValue(21600))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
  new SlashCommandBuilder().setName("lock").setDescription("Zablokuj pisanie na kanale")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
  new SlashCommandBuilder().setName("unlock").setDescription("Odblokuj pisanie na kanale")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
  new SlashCommandBuilder().setName("kick").setDescription("Wyrzuć użytkownika z serwera")
    .addUserOption(o => o.setName("uzytkownik").setDescription("Użytkownik").setRequired(true))
    .addStringOption(o => o.setName("powod").setDescription("Powód").setMaxLength(500))
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),
  new SlashCommandBuilder().setName("ban").setDescription("Zbanuj użytkownika")
    .addUserOption(o => o.setName("uzytkownik").setDescription("Użytkownik").setRequired(true))
    .addStringOption(o => o.setName("powod").setDescription("Powód").setMaxLength(500))
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
  new SlashCommandBuilder().setName("unban").setDescription("Odbanuj użytkownika po ID")
    .addStringOption(o => o.setName("id").setDescription("ID użytkownika").setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
  new SlashCommandBuilder().setName("timeout").setDescription("Nadaj timeout użytkownikowi")
    .addUserOption(o => o.setName("uzytkownik").setDescription("Użytkownik").setRequired(true))
    .addIntegerOption(o => o.setName("minuty").setDescription("1-40320 minut").setRequired(true).setMinValue(1).setMaxValue(40320))
    .addStringOption(o => o.setName("powod").setDescription("Powód").setMaxLength(500))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
  new SlashCommandBuilder().setName("untimeout").setDescription("Zdejmij timeout")
    .addUserOption(o => o.setName("uzytkownik").setDescription("Użytkownik").setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
  new SlashCommandBuilder().setName("warn").setDescription("Nadaj ostrzeżenie użytkownikowi")
    .addUserOption(o => o.setName("uzytkownik").setDescription("Użytkownik").setRequired(true))
    .addStringOption(o => o.setName("powod").setDescription("Powód").setRequired(true).setMaxLength(500))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
  new SlashCommandBuilder().setName("warnings").setDescription("Pokaż ostrzeżenia użytkownika")
    .addUserOption(o => o.setName("uzytkownik").setDescription("Użytkownik").setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
  new SlashCommandBuilder().setName("clear-warnings").setDescription("Usuń ostrzeżenia użytkownika")
    .addUserOption(o => o.setName("uzytkownik").setDescription("Użytkownik").setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
  new SlashCommandBuilder().setName("role-add").setDescription("Nadaj użytkownikowi rolę")
    .addUserOption(o => o.setName("uzytkownik").setDescription("Użytkownik").setRequired(true))
    .addRoleOption(o => o.setName("rola").setDescription("Rola").setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),
  new SlashCommandBuilder().setName("role-remove").setDescription("Odbierz użytkownikowi rolę")
    .addUserOption(o => o.setName("uzytkownik").setDescription("Użytkownik").setRequired(true))
    .addRoleOption(o => o.setName("rola").setDescription("Rola").setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),
  new SlashCommandBuilder().setName("nick").setDescription("Zmień pseudonim użytkownika")
    .addUserOption(o => o.setName("uzytkownik").setDescription("Użytkownik").setRequired(true))
    .addStringOption(o => o.setName("nazwa").setDescription("Nowy pseudonim; pomiń, aby usunąć").setMaxLength(32))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageNicknames),
  new SlashCommandBuilder().setName("announce").setDescription("Wyślij ogłoszenie na wybrany kanał")
    .addChannelOption(o => o.setName("kanal").setDescription("Kanał tekstowy").addChannelTypes(ChannelType.GuildText).setRequired(true))
    .addStringOption(o => o.setName("tresc").setDescription("Treść ogłoszenia").setRequired(true).setMaxLength(2000))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
  new SlashCommandBuilder().setName("embed").setDescription("Wyślij własny embed")
    .addStringOption(o => o.setName("tytul").setDescription("Tytuł").setRequired(true).setMaxLength(256))
    .addStringOption(o => o.setName("opis").setDescription("Opis").setRequired(true).setMaxLength(4000))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)

].map(c => c.toJSON());
