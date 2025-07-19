// twitter.js
require('dotenv').config();
const { chromium } = require('playwright');
const fs        = require('fs');
const path      = require('path');
const fetch     = require('node-fetch');

async function sendTweet(content, imageUrl = null) {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  try {
    const page = await browser.newPage();

    // Login
    await page.goto('https://x.com/i/flow/login', { waitUntil: 'networkidle' });
    await page.fill('input[name="text"]', process.env.TWITTER_USERNAME);
    await page.keyboard.press('Enter');
    await page.fill('input[name="password"]', process.env.TWITTER_PASSWORD);
    await page.keyboard.press('Enter');
    await page.waitForSelector('a[data-testid="AppTabBar_Home_Link"]', { timeout: 15000 });

    // Open composer
    await page.click('a[data-testid="SideNav_NewTweet_Button"]');
    await page.waitForSelector('div[role="textbox"]', { timeout: 15000 });

    // Optional image
    let tempImage;
    if (imageUrl) {
      const res    = await fetch(imageUrl);
      const buffer = await res.buffer();
      tempImage    = path.join(__dirname, 'temp.png');
      fs.writeFileSync(tempImage, buffer);
      await page.setInputFiles('input[type="file"]', tempImage);
      await page.waitForSelector('div[aria-label="Image"]', { timeout: 10000 });
    }

    // Type & send
    await page.fill('div[role="textbox"]', content);
    await page.waitForSelector('[data-testid="tweetButton"]', { timeout: 15000 });
    await page.click('button[data-testid="tweetButton"]');

    // Cleanup
    if (tempImage) fs.unlinkSync(tempImage);
  } finally {
    await browser.close();
  }
}

module.exports = { sendTweet };
