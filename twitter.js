require('dotenv').config();
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

async function sendTweet(content, imageUrl = null) {
  const browser = await chromium.launch({
    headless: false,
    slowMo: 10000
  });

  let screenshotPath = null;

  try {
    const page = await browser.newPage();
    await page.screenshot({ path: 'test.png' });

    // Login
    await page.goto('https://x.com/i/flow/login', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    await page.waitForSelector('input[autocomplete="username"]', { timeout: 15000 });
    const input = await page.$('input[autocomplete="username"]');
    if (!input) {
      console.log("Username field not found");
    } else {
      await input.fill(process.env.TWITTER_USERNAME);
    }

    await page.screenshot({ path: 'username.png' });
    await page.keyboard.press('Enter');

    // await page.waitForSelector('input[type="text"], input[type="email"]');
    // await page.fill('input[type="text"], input[type="email"]', process.env.TWITTER_VERIFICATION_NUMBER);
    // await page.screenshot({ path: 'number.png' });
    // await page.keyboard.press('Enter');

    await page.waitForSelector('input[name="password"]', { visible: true, timeout: 5000 });
    await page.fill('input[name="password"]', process.env.TWITTER_PASSWORD);
    await page.keyboard.press('Enter');

    await page.waitForSelector('a[data-testid="AppTabBar_Home_Link"]', { timeout: 15000 });
    await page.click('a[data-testid="SideNav_NewTweet_Button"]');
    await page.waitForSelector('div[role="textbox"]', { timeout: 15000 });
    await page.focus('div[role="textbox"]');

    function parseAndAddMention(input) {
      const lines = input.split('\n').map(line => line.trim());
      const nonEmptyLines = lines.filter(line => line.length > 0);
      const lastSentence = nonEmptyLines[nonEmptyLines.length - 1];
      // Prepend @grok and return the result
      const mentionText = `@grok ${lastSentence}`;
      // Get the top-most text (first item in the array)
      const firstSentence = nonEmptyLines[0];
      // Append two new lines and the top-most text
      return `${mentionText}\n\n${firstSentence}`;
    }

    content = parseAndAddMention(content)
    console.log(content);

    // Optional image
    let tempImage;
    if (imageUrl) {
      const res = await fetch(imageUrl);
      const buffer = await res.buffer();
      tempImage = path.join(__dirname, 'temp.png');
      fs.writeFileSync(tempImage, buffer);
      await page.setInputFiles('input[type="file"]', tempImage);
      await page.waitForSelector('div[aria-label="Image"]', { timeout: 10000 });
    }

    // Type & send
    await page.fill('div[role="textbox"]', content);
    await page.waitForSelector('[data-testid="tweetButton"]', { timeout: 15000 });
    await page.click('button[data-testid="tweetButton"]');

    await page.goto('https://x.com/imgrokkingit');
    console.log('Waiting for Grok’s response...');
    await page.waitForTimeout(60000);
    await page.click('a[role="tab"]:has-text("Replies")');
    await page.screenshot({ path: 'beforeclicktweet.png', fullPage: true });
    await page.waitForTimeout(1500);
    await page.waitForSelector('article[role="article"]');
    await page.click('article[role="article"]');
    await page.waitForTimeout(1500);
    const tweets = await page.$$('article[role="article"]');

    screenshotPath = path.join(__dirname, "grok_reply.png");
    if (tweets.length > 1) {
      await tweets[1].screenshot({ path: screenshotPath });
    } else {
      await page.screenshot({ path: screenshotPath, fullPage: true });
    }

    if (tempImage) fs.unlinkSync(tempImage);
  } finally {
    await browser.close();
    return screenshotPath;
  }
}

module.exports = { sendTweet };
