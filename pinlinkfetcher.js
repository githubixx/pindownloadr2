//
// FYI: This code just works somehow ;-) Definitely not a good example of
//      good style or whatever... Basically no error handling!
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
var login_url = 'https://www.pinterest.com/login/';
var user_agent = 'Mozilla/5.0 (Windows NT 10.0; WOW64; rv:52.0) Gecko/20100101 Firefox/52.0';

var url = '';
var loginname = '';
var loginpw = '';
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
if (Object.keys(casper.cli.options).length < 3) {
  casper.echo("Need more options!");
  casper.echo("");
  casper.echo("Example : casperjs pinlinkfetcher.js --url=url                              [required, e.g. /jaymenicoleh/future-home/]");
  casper.echo("                                     --loginname=loginname                  [required]");
  casper.echo("                                     --loginpw=loginpassword                [required]");
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


// Login
casper.start(login_url, function() {
  // Fill form with username and password.
  this.fill('body > div.App.AppBase.Module > div > div.mainContainer > div > div > div > div > div > div:nth-child(3) > form', {
    id: loginname,
    password: loginpw
  }, true);
});


// After login we get redirected to homepage.
// Wait until homepage is loaded before execute next step.
casper.waitForText("unless", function() {
  //this.echo('pinterest homepage loaded!');
});

// Load the board we want to download.
casper.thenOpen('https://www.pinterest.com' + url, function() {
  //var html = this.getHTML();
});

// Wait until the board is loaded.
casper.waitForUrl(url, function() {
  //this.echo('Final page loaded!');
});

// We need jquery for further processing.
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

  window.done = 0;
  window.data = new Array();

  var pTimer = window.setInterval(function() {
 
    var pUrls = $('._35.block.col-12.absolute');

    var pLength = parseInt($('._4a.relative').css('height').replace('px', ''));
	  
    if (pLength == pLastCount) {
      window.clearInterval(pTimer);
      window.done = 1;
    } else {
      for ( var i=0 ; i < pUrls.length ; i++) {
        var pPin = {};
        pPin['pin_thumbnail'] = $(pUrls[i]).attr('src');
        //__utils__.echo(pPin['pin_thumbnail']);

        // search if pin already pushed
        if (!(pPin['pin_thumbnail'] in pPinsIndexes)) {
          window.data.push(pPin); 
          pPinsIndexes[pPin['pin_thumbnail']] = '';
        }
      }

      pLastCount = pLength;

      this.scrollTo(0,document.body.scrollHeight);
      pTimerCounter++;

    }
  }, 6000);  // use high values like 6000 ms to wait for next page
             // to reduce possibility that fetching images stops to early.
             // This value depends on your wire speed and the response time
             // from pinterest.com.
});

casper.waitFor(function() {
  return this.getGlobal('done') === 1;
  }, function() {

    pins = this.getGlobal('data');
    board = new Array();

    pins_count = pins.length;
    for (var i = 0; i < pins_count; i++) {
      pin = pins[i];
      this.echo(pin['pin_thumbnail']);
    }

  this.exit();

  }, function timeout() {
}, 1800000); // allow timeout of 30 minutes to execute the script...

casper.run();

