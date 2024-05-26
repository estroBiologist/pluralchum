import fs from "fs";
import path from "path";
import os from "os";

const packageInfo = JSON.parse(fs.readFileSync(path.join(import.meta.dirname, "package.json")));
console.log(`\n[+] Successfully built Pluralchum v${packageInfo.version}!`);

const pluginDir = os.platform() == "win32" ? path.join(os.homedir(), "AppData", "Roaming", "BetterDiscord", "plugins") : os.platform() == "linux" ? path.join(os.homedir(), ".config", "BetterDiscord", "plugins") : os.platform() == "darwin" ? path.join(os.homedir(), "Library", "Application Support", "BetterDiscord", "plugins") : null;
fs.copyFileSync(path.join(import.meta.dirname, "dist", "Pluralchum.plugin.js"), path.join(pluginDir, "Pluralchum.plugin.js"))

console.log(`[+] Successfully reloaded Pluralchum!\n`);