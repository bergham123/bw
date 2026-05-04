import makeWASocket, { fetchLatestBaileysVersion } from "@whiskeysockets/baileys";
import P from "pino";

async function start() {

    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        logger: P({ level: "silent" }),
        printQRInTerminal: false
    });

    console.log("🚀 Bot running in GitHub Actions (test mode)");

    sock.ev.on("connection.update", (update) => {
        console.log("🔄 Update:", update);
    });

    sock.ev.on("messages.upsert", (m) => {
        console.log("📩 Message:", m);
    });
}

start();
