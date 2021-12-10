const Express = require("express");
const Puppeteer = require('puppeteer');
const app = Express();

const PORT = process.env.PORT || 3000;

(async function() {
  
  function getSiteUrl(site, query) {
    const siteUrl = new URL(site);

    if (query) {
      const searchParams = new URLSearchParams(query);
      siteUrl.search = searchParams;
    }

    return siteUrl;
  }

  async function rewritePaths(page, origin) {
    await page.evaluate((origin) => {
      const pathRegex = /^\/{1}(?!\/).*/;
      const originRegex = new RegExp(`^${origin}`);
      const stylesheets = document.querySelectorAll("link");
      const links = document.querySelectorAll("a");
      const images = document.querySelectorAll("img");

      stylesheets.forEach((sheet) => {
        const href = sheet.getAttribute("href");
        if (pathRegex.test(href)) {
          sheet.setAttribute("href", `${origin}${href}`);
        }

      });      

      links.forEach((link) => {
        const href = link.getAttribute("href");
        if (pathRegex.test(href)) {
          link.setAttribute("href", `/site/${origin}${href}`);
        } else if (originRegex.test(origin)) {
          link.setAttribute("href", `/site/${href}`);
        }
      });    
      
      images.forEach((img) => {
        const src = img.getAttribute("src");
        const datasrc = img.getAttribute("data-src");

        if (!src) {
          img.setAttribute("src", datasrc);
        }
      });
    }, origin);
  }

  async function removeScripts(page) {
    await page.evaluate(() => {
      const scripts = document.querySelectorAll("script");

      scripts.forEach((script) => {
        script.remove();
      });       
    });
  }

  app.get("/site/:site(https?:\/\/?[_\da-z0-9\.-]+\.[a-z\.]{2,6}\/?[_\da-z0-9\.\/-]+)", async function (req, res) {
    
    const browser = await Puppeteer.launch({ args: ['--no-sandbox']  });

    const { params, query, url, baseUrl } = req;
    const siteUrl = getSiteUrl(params.site, query);

    const page = await browser.newPage();
    await page.setDefaultNavigationTimeout(0);    
    await page.goto(siteUrl.href);
    await rewritePaths(page, siteUrl.origin);
    await removeScripts(page);

    const html = await page.content();
    browser.close();
    res.setHeader('Content-Type', 'text/html');
    res.send(html);

  });

  app.listen(PORT);
}());
