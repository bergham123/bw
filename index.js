import makeWASocket, {
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion
} from "@whiskeysockets/baileys";

import P from "pino";
import readline from "readline";

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const question = (text) => new Promise(r => rl.question(text, r));

async function start() {

    const { state, saveCreds } = await useMultiFileAuthState("auth_info");
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        logger: P({ level: "silent" }),
        auth: state
    });

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", async (update) => {
        const { connection, lastDisconnect } = update;

        if (connection === "open") {
            console.log("✅ Connected");
        }

        if (connection === "close") {
            const code = lastDisconnect?.error?.output?.statusCode;

            console.log("❌ Disconnected:", code);

            if (code !== DisconnectReason.loggedOut) {
                start();
            }
        }
    });

    // 🔑 Pairing ONLY ON FIRST RUN
    if (!sock.authState.creds.registered) {
        const phone = await question("📞 Enter number (2126xxxxxxx): ");
        const code = await sock.requestPairingCode(phone);

        console.log("\n🔐 PAIRING CODE:", code);
        console.log("👉 Open WhatsApp → Linked devices → Link with code\n");

        rl.close();
    }

    sock.ev.on("messages.upsert", async (m) => {
        const msg = m.messages[0];
        if (!msg.message) return;

        const text =
            msg.message.conversation ||
            msg.message.extendedTextMessage?.text || "";

        const sender = msg.key.remoteJid;

        console.log("📩", text);

        if (text === "hi") {
            await sock.sendMessage(sender, { text: "Hello 👋" });
        }
    });
}

start();
