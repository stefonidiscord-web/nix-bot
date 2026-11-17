const fs = require("node:fs");
const path = require("node:path");

const dataDir = path.join(process.cwd(), "data");
const file = path.join(dataDir, "settings.json");

const defaults = { welcome: null, verifyRoleId: null, selfRoles: [], warnings: {} };

function read() {
  try {
    fs.mkdirSync(dataDir, { recursive: true });
    if (!fs.existsSync(file)) fs.writeFileSync(file, JSON.stringify(defaults, null, 2));
    return { ...defaults, ...JSON.parse(fs.readFileSync(file, "utf8")) };
  } catch (error) {
    console.error("Nie można odczytać ustawień:", error);
    return { ...defaults };
  }
}

function write(data) {
  fs.mkdirSync(dataDir, { recursive: true });
  const temp = `${file}.tmp`;
  fs.writeFileSync(temp, JSON.stringify(data, null, 2));
  fs.renameSync(temp, file);
}

function update(mutator) {
  const data = read();
  mutator(data);
  write(data);
  return data;
}

module.exports = { read, write, update };
