// twitter.js
require('dotenv').config();
const { chromium } = require('playwright');
const fs        = require('fs');
const path      = require('path');
const fetch     = require('node-fetch');

async function sendTweet(content, imageUrl = null) {
  console.log('sendTweet starting…');
  let browser;
  try {
    console.log('🔹 Launching browser...');
    browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
    console.log('🔹 Browser launched.');

    const page = await browser.newPage();
    console.log('🔹 New page created.');

    // ─── LOGIN FLOW ──────────────────────────────────────────
    console.log('🔹 Navigating to login flow...');
    await page.goto('https://x.com/i/flow/login', { waitUntil: 'networkidle' });
    console.log('🔹 Login page loaded.');

    console.log('🔹 Waiting for username input...');
    await page.waitForSelector('input[name="text"]', { visible: true, timeout: 15000 });
    console.log('🔹 Filling username...');
    await page.fill('input[name="text"]', process.env.TWITTER_USERNAME, { delay: 50 });
    console.log('🔹 Username filled, pressing Enter...');
    await page.keyboard.press('Enter');

    console.log('🔹 Waiting for password input...');
    await page.waitForSelector('input[name="password"]', { visible: true, timeout: 15000 });
    console.log('🔹 Filling password...');
    await page.fill('input[name="password"]', process.env.TWITTER_PASSWORD, { delay: 50 });
    console.log('🔹 Password filled, pressing Enter...');
    await page.keyboard.press('Enter');

    console.log('🔹 Waiting for Home link to confirm login...');
    await page.waitForSelector('a[data-testid="AppTabBar_Home_Link"]', { visible: true, timeout: 15000 });
    console.log('🔹 Login successful, Home link visible.');

    // ─── OPEN COMPOSER ──────────────────────────────────────
    console.log('🔹 Opening tweet composer...');
    await page.click('a[data-testid="SideNav_NewTweet_Button"]');
    console.log('🔹 Tweet composer opened.');

    console.log('🔹 Waiting for tweet textbox...');
    await page.waitForSelector('div[role="textbox"]', { visible: true, timeout: 15000 });
    console.log('🔹 Tweet textbox ready.');

    // ─── DEBUG DUMP ─────────────────────────────────────────
    console.log('🔹 CURRENT URL:', page.url());
    const allTestIds = await page.$$eval('[data-testid]', els =>
      els.map(el => el.getAttribute('data-testid'))
    );
    console.log('🔍 ALL data-testids:', allTestIds);
    const html = await page.content();
    fs.writeFileSync('compose_dump.html', html);
    console.log('🔹 Wrote full page HTML to compose_dump.html');

    console.log('🔹 Capturing debug screenshot...');
    await page.screenshot({ path: 'compose-debug.png', fullPage: true });
    console.log('🔹 Debug screenshot saved.');
    console.log('🔹 COMPOSE DOM SNIPPET:\n', (await page.content()).slice(0, 2000));

    // ─── IMAGE UPLOAD ───────────────────────────────────────
    let tempImage;
    if (imageUrl) {
      console.log('🔹 Fetching image from:', imageUrl);
      const res = await fetch(imageUrl);
      const buffer = await res.buffer();
      tempImage = path.join(__dirname, 'temp.png');
      console.log('🔹 Saving image to:', tempImage);
      fs.writeFileSync(tempImage, buffer);
      console.log('🔹 Uploading image...');
      await page.setInputFiles('input[type="file"]', tempImage);
      await page.waitForSelector('div[aria-label="Image"]', { timeout: 10000 });
      console.log('🔹 Image uploaded.');
    }

    // ─── TYPE & SEND ────────────────────────────────────────
    console.log('🔹 Focusing tweet textbox...');
    await page.focus('div[role="textbox"]');
    console.log('🔹 Typing tweet content...');
    await page.keyboard.type(content, { delay: 50 });
    await page.screenshot({ path: 'typing.png', fullPage: true });

    console.log('🔹 Clicking Tweet button...');
    await page.waitForSelector('[data-testid="tweetButton"]', { visible: true, timeout: 15000 });
    await page.click('button[data-testid="tweetButton"]');    console.log('✅ Tweet submitted successfully.');

    // ─── CLEANUP ────────────────────────────────────────────
    if (tempImage) {
      console.log('🔹 Cleaning up temp image...');
      fs.unlinkSync(tempImage);
      console.log('🔹 Temp image removed.');
    }

    await browser.close();
    console.log('🔹 Browser closed.');

  } catch (err) {
    console.error('sendTweet failed:', err);
    if (browser) {
      try { await browser.close(); } catch (_) {}
    }
    throw err;
  }
}

module.exports = { sendTweet };
