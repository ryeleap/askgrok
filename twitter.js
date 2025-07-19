console.log("🔌 twitter.js loaded");
require("dotenv").config();

/**
 * Stubbed sendTweet: logs out what it received so you can verify
 * @param {string} content — the combined original+prompt text
 * @param {string|null} imageUrl — URL of any attached image
 */
async function sendTweet(content, imageUrl = null) {
  console.log("=====================");
  console.log("📝 sendTweet called!");
  console.log("— content:");
  console.log(content);
  console.log("— imageUrl:", imageUrl);
  console.log("=====================");
  return Promise.resolve();
}

module.exports = { sendTweet };
