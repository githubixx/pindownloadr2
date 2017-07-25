//
// FYI: This code just works somehow ;-) I'm not a JavaScript programmer.
// Just tried to get it work ;-) I guess this isn't a good example of
// good JavaScript style or whatever... Basically no error handling!
// Or to make things short: It work's for me :D
//

//
// Imports
//
var fs = require('fs');
var utils = require('clientutils');


//
// Some default variables
//
var log_level = 'error';
var verbose = false;
var viewport_width = 1920;
var viewport_height = 1280;
var user_agent = 'Mozilla/5.0 (Windows NT 10.0; WOW64; rv:52.0) Gecko/20100101 Firefox/52.0';
var domain_prefix = "https://www.pinterest."

var url = '';
var loginname = '';
var loginpw = '';
var country_domain = '';
var timeout = 6000;


//
// CasperJS defaults
//
var casper = require('casper').create({
  viewportSize: {width: viewport_width, height: viewport_height},
  logLevel: log_level,
  verbose: verbose
});


//
// Removing default options passed by the Python executable
//
casper.cli.drop('cli');
casper.cli.drop('casper-path');


//
// Print out messages in headless browser context.
// Only needed for debugging...
//

if(casper.cli.has("debug_output")) {
  casper.on('remote.message', function(msg) {
    this.echo('remote message caught: ' + msg);
  });

  casper.on( 'page.error', function (msg, trace) {
    this.echo( 'Error: ' + msg, 'ERROR' );
  });
}


//
// At least we need a URL, Pinterest login name and password
//
if (Object.keys(casper.cli.options).length < 4) {
  casper.echo("Need more options!");
  casper.echo("");
  casper.echo("Example : casperjs pinlinkfetcher.js --url=url                              [required, e.g. /jaymenicoleh/future-home/]");
  casper.echo("                                     --loginname=loginname                  [required, email address you use for pinterest login]");
  casper.echo("                                     --loginpw=loginpassword                [required, the password you use for pinterest login]");
  casper.echo("                                     --country=country                      [required, e.g. com|de|...]");
  casper.echo("");
  casper.echo("INFO: Does not work with Facebook login!");
  casper.echo("");
  casper.exit();
}

// Set the useragent we use to connect to pinterest.com.
casper.userAgent(user_agent);

// Increase timeout for wait* functions
casper.options.waitTimeout = 20000;


//
// Get CLI options
//
if(casper.cli.has("url")) {
  var url = casper.cli.get("url");
} else {
  casper.echo("Missing path to board (--url)!");
  casper.exit();
}

if(casper.cli.has("loginname")) {
  var loginname = casper.cli.get("loginname");
} else {
  casper.echo("Missing login (--loginname)!")
  casper.exit();
}

if(casper.cli.has("loginpw")) {
  var loginpw = casper.cli.get("loginpw");
} else {
  casper.echo("Missing login password (--loginpw)!");
  casper.exit();
}

if(casper.cli.has("country")) {
  var country_domain = domain_prefix + casper.cli.get("country");
} else {
  casper.echo("Missing country (--country)!");
  casper.exit();
}

// Navigate to homepage
casper.start(country_domain + "/", function() {
});

// Insert username and password
casper.then(function () {
  this.sendKeys('input[type=email]', loginname);
  this.sendKeys('input[type=password]', loginpw);
});

// We need JQuery to click the red login button...
casper.then(function () {
  this.page.injectJs('jquery-3.2.1.min.js');
});

// Click login button
casper.thenEvaluate(function() {
  $('.red.SignupButton.active').click();
})

// After login we get redirected to homepage.
// Wait until homepage is loaded before execute next step.
casper.wait(10000, function() {
});

// Load the board we want to download.
casper.thenOpen(country_domain + url, function() {
  //var html = this.getHTML();
});

// Wait until the board is loaded.
casper.waitForUrl(url, function() {
  //this.echo('Final page loaded!');
});

// Insert JQuery for DOM processing.
casper.then(function () {
  this.page.injectJs('jquery-3.2.1.min.js');
});

// Finally grab the picture URLs.
casper.thenEvaluate(function() {

  // This reenables logging to console in headless browser context
  delete console.log;

  var pTimerCounter = 1;
  var pLastCount = 0;
  var pPins = new Array();
  var pPinsIndexes = new Array();

  window.pDone = 0;
  window.pData = new Array();

  var pTimer = window.setInterval(function() {

		// Select all images visible by class id
	  var pUrls = $('._m9._1x._3m._29');

		// Get CSS height property
    var pLength = parseInt($('._tv._27').css('height').replace('px', ''));
	  
    if (pLength == pLastCount) {
      window.clearInterval(pTimer);
      window.pDone = 1;
    } else {
      for ( var i=0 ; i < pUrls.length ; i++) {
        var pPin = {};
        pPin['pin_thumbnail'] = $(pUrls[i]).attr('src');
        //__utils__.echo(pPin['pin_thumbnail']);

        // search if pin already pushed
        if (!(pPin['pin_thumbnail'] in pPinsIndexes)) {
          window.pData.push(pPin);
          pPinsIndexes[pPin['pin_thumbnail']] = '';
        }
      }

      pLastCount = pLength;

      this.scrollTo(0,document.body.scrollHeight);
      pTimerCounter++;

    }
  }, 10000);  // use high values like 6000 ms to wait for next page
             // to reduce possibility that fetching images stops to early.
             // This value depends on your wire speed and the response time
             // from pinterest.com.
});

casper.waitFor(function() {
  return this.getGlobal('pDone') === 1;
  }, function() {

    var pins = this.getGlobal('pData');
    var board = new Array();

    var pins_count = pins.length;
    for (var i = 0; i < pins_count; i++) {
      var pin = pins[i];
      this.echo(pin['pin_thumbnail']);
    }

  this.exit();

  }, function timeout() {
}, 3600000); // allow timeout of 30 minutes to execute the script...

casper.run();

