// twitter.js
require('dotenv').config();
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const { Console } = require('console');

async function sendTweet(content, imageUrl = null) {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  try {
    const page = await browser.newPage();

    // Login
    await page.goto('https://x.com/i/flow/login', { waitUntil: 'networkidle' });

    await page.screenshot({ path: 'login_page_before_password.png' });

    await page.fill('input[name="text"]', process.env.TWITTER_USERNAME);
    await page.keyboard.press('Enter');

    // await page.waitForSelector('input[type="text"], input[type="email"]');
    // await page.fill('input[type="text"], input[type="email"]', process.env.TWITTER_VERIFICATION_NUMBER);
    // await page.screenshot({ path: 'number.png' });
    // await page.keyboard.press('Enter');

    await page.screenshot({ path: 'login_page.png' });

    console.log("hit");
    await page.waitForSelector('input[name="password"]', { visible: true, timeout: 5000 });
    await page.screenshot({ path: 'password.png' });
    await page.fill('input[name="password"]', process.env.TWITTER_PASSWORD);
    await page.keyboard.press('Enter');
    await page.waitForSelector('a[data-testid="AppTabBar_Home_Link"]', { timeout: 15000 });

    // Open composer
    await page.click('a[data-testid="SideNav_NewTweet_Button"]');
    await page.waitForSelector('div[role="textbox"]', { timeout: 15000 });
    await page.focus('div[role="textbox"]');

    console.log(content);


    function parseAndAddMention(input) {
      // Split the input into lines
      const lines = input.split('\n').map(line => line.trim());

      // Remove any empty lines
      const nonEmptyLines = lines.filter(line => line.length > 0);

      // Get the bottom-most sentence (last item in the array)
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

    // await page.getByRole('button', { name: 'Got it' }).click();
    await page.goto('https://x.com/imgrokkingit');
    console.log('🔹 Waiting for Grok’s response...');
    await page.waitForTimeout(60000);

    // const buttons = await page.$$eval('button', els =>
    //   els.map(el => ({
    //     text: el.innerText.trim(),
    //     testid: el.getAttribute('data-testid'),
    //     ariaLabel: el.getAttribute('aria-label'),
    //     class: el.className
    //   }))
    // );

    // console.log('🔘 ALL BUTTONS:', buttons);
    // fs.writeFileSync('button_dump.json', JSON.stringify(buttons, null, 2));
    await page.screenshot({ path: 'replies.png', fullPage: true });
    await page.click('a[role="tab"]:has-text("Replies")');

    await page.screenshot({ path: 'beforeclicktweet.png', fullPage: true });
    await page.waitForTimeout(1500);

    await page.waitForSelector('article[role="article"]');
    await page.click('article[role="article"]');

    await page.waitForTimeout(1500);

    const tweets = await page.$$('article[role="article"]');

    if (tweets.length > 1) {
      const grokTweet = tweets[1];
      await grokTweet.screenshot({ path: 'grok_reply.png' });
      console.log('✅ Cropped screenshot of Grok’s reply taken.');
    } else {
      console.warn('⚠️ Grok reply not found, falling back to full-page screenshot.');
      await page.screenshot({ path: 'grok_reply.png', fullPage: true });
    }


    // Cleanup
    if (tempImage) fs.unlinkSync(tempImage);
  } finally {
    await browser.close();
    return path.join(__dirname, 'grok_reply.png');
  }
}

module.exports = { sendTweet };
