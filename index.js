require("dotenv").config();

let sendTweet;
try {
  ({ sendTweet } = require("./twitter"));
} catch (err) {
  console.error("require(./twitter) failed:", err);
}

const { Client, GatewayIntentBits } = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.on("messageCreate", async (message) => {
  console.log("messageCreate:", {
    content: message.content,
    author: message.author.tag,
    reference: message.reference?.messageId,
  });

  if (message.author.bot) return;
  if (!message.mentions.has(client.user)) return;
  const ref = message.reference;
  if (!ref?.messageId) {
    return message.reply("Please reply to a message when mentioning me.");
  }

  let original;
  try {
    original = await message.channel.messages.fetch(ref.messageId);
  } catch (err) {
    console.error("Fetch error:", err);
    return message.reply("Couldn’t fetch that message.");
  }

  const prompt = message.content.replace(/<@!?\d+>/g, "").trim();
  const textToTweet = `${original.content}\n\n${prompt}`;
  const imageUrl = original.attachments.first()?.url || null;

  await message.reply("Working on it...");
  try {
    const screenshotPath = await sendTweet(textToTweet, imageUrl);
    if (screenshotPath) {
      await message.reply({
        content: "Tweet sent!",
        files: [screenshotPath],
      });
    } else {
      await message.reply("Tweet sent, but no screenshot was captured.");
    }
  }
  catch (err) {
    console.error("sendTweet error:", err);
    await message.reply("Failed to send tweet.");
  }
});

client.login(process.env.DISCORD_TOKEN);
