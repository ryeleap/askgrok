require("dotenv").config();
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");
const fetch = require("node-fetch");

async function sendTweet(content, imageUrl = null) {
  console.log("sendTweet starting…");
  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox"],
  });
  const page = await browser.newPage();

  await page.goto("https://twitter.com/login", { waitUntil: "networkidle" });
  await page.fill(
    'input[name="session[username_or_email]"]',
    process.env.TWITTER_USERNAME,
  );
  await page.fill(
    'input[name="session[password]"]',
    process.env.TWITTER_PASSWORD,
  );
  await page.press('input[name="session[password]"]', "Enter");

  await page.waitForSelector('div[aria-label="Tweet text"]', {
    timeout: 15000,
  });

  let tempImagePath = null;
  if (imageUrl) {
    console.log("📷 Fetching image…");
    const res = await fetch(imageUrl);
    const buffer = await res.buffer();
    tempImagePath = path.join(__dirname, "temp.png");
    fs.writeFileSync(tempImagePath, buffer);
    await page.setInputFiles('input[type="file"]', tempImagePath);
    await page.waitForSelector('div[aria-label="Image"]', { timeout: 10000 });
  }

  await page.click('div[aria-label="Tweet text"]');
  await page.keyboard.type(content, { delay: 50 });
  await page.click('div[data-testid="tweetButtonInline"]');
  console.log("Tweet submitted.");

  if (tempImagePath) fs.unlinkSync(tempImagePath);
  await browser.close();
}

module.exports = { sendTweet };
