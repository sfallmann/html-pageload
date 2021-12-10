const express = require("express");
const puppeteer = require('puppeteer');
const app = express();

const PORT = process.env.PORT || 3000;

(async function() {
  const browser = await puppeteer.launch({ args: ['--no-sandbox']  });

  app.get("/", async function (req, res) {
    const page = await browser.newPage();
    await page.goto('https://redstate.com', { waitUntil: 'networkidle2' });
    const html = await page.content();
    res.send(html);
  });

  app.listen(PORT);
}());
