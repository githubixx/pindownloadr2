// This code needs lot of refactoring ;-) It just "works for me" :D

// Import chromless
const { Chromeless } = require('chromeless')

// Import express middleware
const express = require('express')
const app = express()

// The board to scrape e.g. '/misssabine/art-design-flowers/'
// '/' at the beginning and end are needed!
var board = '';
// The pinterest login (normally your e-mail address)
var loginName = '';
// The pinterest login password
var loginPw = '';
// The country domain (e.g. 'com','de',...)
var countryDomain = '';

// How long we want to wait for the whole scraping process (in ms)?
// Basically this setting effects all "wait..()" functions.
const scriptTimeout = 36000000;
// Viewport width - not used ATM
const viewportWidth = 1280;
// Viewport height - not used ATM
const viewportHeight = 960;
// pinterest URL prefix (TLD needs be supplied as argument to the script)
const domainPrefix = 'https://www.pinterest.';

// Selector for picture count
const selectorPictureCount = '._w7._0._1._2._w9._3a._3._d._b._5';

// The preview pictures have a "class" attribute with this value.
// The IMG tag contains a SRC attribute we fetch for every pic.
const selectorPreviewPictures = '._u3._45._y6._4h';

async function run(req,res) {

  req.setTimeout(scriptTimeout);

  // Login needed?
  var do_login = true;

  // Create chromeless instance
  const chromeless = new Chromeless({
    waitTimeout: scriptTimeout,
    launchChrome: false
  })

  // Get all cookies
  const cookies = await chromeless
    .allCookies();

  // If there is a cookie named "cm_sub" we are basically
  // logged in. But that's not the whole truth ;-) Need to
  // investigate further. But good enough for now.
  cookies.forEach(function(cookie) {
    if (cookie.name === 'cm_sub') {
      do_login = false;
    }
  })

  // Login if needed
  if (do_login) {
    await login(chromeless);
  }

  // Start scraping the board. The result is a JSON string
  // containing links of the preview pictures.
  const result = await scrape(chromeless);
  res.send(result);

  // Finally disconnect from Chrome
  await chromeless.end();
}

async function login(chromeless) {
  const login = await chromeless
    .goto(domainPrefix + countryDomain + '/login/')
    .type(loginName, 'input[type=email]')
    .type(loginPw, 'input[type=password]')
    .wait(1000)
    .click('.red.SignupButton.active')
    .wait(5000)
}

async function scrape(chromeless) {
  /* Go to board we want to scrape */
  const page = await chromeless
    .setUserAgent('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3497.32 Safari/537.36')
    .goto(domainPrefix + countryDomain + board)
    .wait(selectorPreviewPictures)
    .wait(selectorPictureCount)
    .wait(1000)
    .evaluate((selectorPictureCount, selectorPreviewPictures) => {
      /* Scroll to next page every ... */
      var scrollInterval = 6000;

      /* Check if scraping is done every ... */
      var pageEndInterval = 3000;

      /* If we reached the end of the board set this to 1  */
      window.scrollDone = 0;

      /* Store links as JSON if scrolling is done */
      //window.links;
      window.links = new Set();

      /* Get image count from page top */
      var imageCountTmp = document.querySelector(selectorPictureCount).innerText;
      var imageCountRegex = /^([0-9]+)/g;
      var result = imageCountRegex.exec(imageCountTmp);
      imageCount = parseInt(result[1]);
      console.log("Image count: " + imageCountTmp);

      /* Callback function to select all images and store result in a set */
      var fetchImages = function (event) {
        var elements = [].map.call(document.querySelectorAll(selectorPreviewPictures),img => (img.src));
        var elementsLen = elements.length;
        for (i = 0; i < elementsLen; i++) {
          if (!window.links.has(elements[i])) {
            window.links.add(elements[i]);
          }
        }
        console.log("Current set size: " + window.links.size);
      }

      /* Add scroll event listener to fetch images after scrolling to next page */
      window.addEventListener('scroll', fetchImages, false);

      /*
       * This function simulates scrolling down the whole board in order
       * to ensure all preview images of a board are loaded.
       */
      var scrollTimer = window.setInterval(function() {
        // Add some margin (+10) to compensate duplicates
        if(window.links.size > imageCount + 10) {
          window.clearInterval(scrollTimer);
          window.scrollDone = 1;
          return true;
        } else {
          window.scrollBy(0,document.documentElement.clientHeight);
        }
      }, scrollInterval);

      /*
       * This timer checks if the end of the page is reached. Create a DIV HTML element
       * to signal the link collector that we're done with scraping. We need this
       * workaround since "waitFn()" in Chromeless isn't implemented yet.
       */
      var waitForPageEndTimer = window.setInterval(function() {
        if(window.scrollDone === 1) {
          window.clearInterval(waitForPageEndTimer);

          /*
           * Total ugly hack but that was the only way to transfer the
           * JSON output (or the image links) from the Browser to the
           * console output later (see below).
           */
          var newDiv = document.createElement("DIV");
          newDiv.appendChild(document.createTextNode(JSON.stringify(Array.from(window.links))));
          var attributeId = document.createAttribute("id");
          attributeId.value = "imagelinks";
          newDiv.setAttributeNode(attributeId);
          document.body.appendChild(newDiv);

          return true;
        }
      }, pageEndInterval);
    }, selectorPictureCount, selectorPreviewPictures)


/*
 * If a DIV HTML element with attribute 'id="imagelinks"' appears
 * in the DOM scraping is done and we can fetch the inner text
 * of the DIV element (which contains JSON as string).
 */
const previewPictureLinks = await chromeless
  .wait('#imagelinks')
  .evaluate(() => {
    var element = document.getElementById('imagelinks');
    var text = element.innerText || element.textContent;
    return text;
  })

  /* JSON string (no JSON object!) of image URLs. */
  return previewPictureLinks;
}

// Get request parameter and put it into variables
var setParameter = function(req, res, next) {
  req.setTimeout(scriptTimeout);
  loginName = req.params.loginname;
  loginPw = req.params.loginpw;
  countryDomain = req.params.countrydomain;
  board = '/' + req.params.user + '/' + req.params.board + '/';

  // This passes further processing to run() function.
  next();
}

// Setup routing
app.get('/pinlinkfetcher/loginname/:loginname/loginpw/:loginpw/countrydomain/:countrydomain/board/:user[\/]:board', [setParameter, run]);

// Start webserver
var server = app.listen(3000, function() {
  console.log('pinlinkfetcher service listening on port ' + server.address().port);
});
server.timeout = scriptTimeout;
