//
// FYI: This code just works somehow ;-) Definitely not a good example of
//      good style or whatever... Basically no error handling!
//

//
// This script try's to generate a list of the boards you're following.
//

//
// Imports
//
var fs = require('fs');


//
// Some default variables
//
var log_level = 'error';
var verbose = false;
var viewport_width = 1920;
var viewport_height = 1280;
var login_url = 'https://www.pinterest.com/login/';
var user_agent = 'Mozilla/5.0 (Windows NT 10.0; WOW64; rv:52.0) Gecko/20100101 Firefox/52.0';

var uri = '';
var loginname = '';
var loginpw = '';
var timeout = 6000;

var x = require('casper').selectXPath;

//
// CasperJS defaults
//
var casper = require('casper').create({
  viewportSize: {width: viewport_width, height: viewport_height},
  logLevel: log_level,
  verbose: verbose
});


//
// Removing default options
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
// At least we need the username, Pinterest login name and password
//
if (Object.keys(casper.cli.options).length < 3) {
  casper.echo("Need more options!");
  casper.echo("");
  casper.echo("Example : casperjs pinmyboards.js --username=username                    [required]");
  casper.echo("                                  --loginname=loginname                  [required]");
  casper.echo("                                  --loginpw=loginpassword                [required]");
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
if(casper.cli.has("username")) {
  var username = casper.cli.get("username");
} else {
  casper.echo("Missing username (--username)!");
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

// The URI we want to download
uri = "/" + username + "/following/";

// Login
casper.start(login_url, function() {
  // Fill form with username and password.
  this.fill('body > div.App.AppBase.Module.content_only > div.appContent > div.mainContainer > div > div > div > form', {
    username_or_email: loginname,
    password: loginpw
  }, true);
});

// After login we get redirected to homepage.
// Wait until homepage is loaded before execute next step.
casper.waitForText("UserNavigateButton", function() {
  //this.echo('pinterest homepage loaded!');
});

// Load the board we want to download.
casper.thenOpen('https://www.pinterest.com' + uri, function() {
  //var html = this.getHTML();
});

// Wait until the board is loaded.
casper.waitForUrl(uri, function() {
  //this.echo('Final page loaded!' + uri);
});

// We need jquery for further processing.
casper.then(function () {
  this.page.injectJs('jquery-3.1.0.min.js');
});

// Load the the page of the boards we follow
casper.then(function() {
  casper.waitForSelector('button.Button:nth-child(3)', function() {
    this.click('button.Button:nth-child(3)');
  });
});

// Wait for first "Unfollow" text...
casper.waitForText("Unfollow", function() {
  //this.echo('Found "Unfollow" text in body');
});

// ... and wait another 10 sec's just to be save.
casper.then(function() {
  casper.wait(10000, function() {
    //this.echo('should appear after 5s');
  });
});

// Finally grab the board URLs
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

    var pUrls = $('.boardLinkWrapper');

    pLength = parseInt($('.padItems').css('height').replace('px', ''));

    if (pLength == pLastCount) {
      window.clearInterval(pTimer);
      window.done = 1;
    } else {
      for ( var i=0 ; i < pUrls.length ; i++) {
        var pPin = {};
        pPin['board_url'] = $(pUrls[i]).attr('href');

        // search if url is already pushed
        if (!(pPin['board_url'] in pPinsIndexes)) {
          window.data.push(pPin);
          pPinsIndexes[pPin['board_url']] = '';
        }
      }

      pLastCount = pLength;

      this.scrollTo(0,document.body.scrollHeight);
      pTimerCounter++;

    }
  }, 10000);
});

// If we scrolled through all pages print the list
casper.waitFor(function() {
  return this.getGlobal('done') === 1;
  }, function() {

    boards = this.getGlobal('data');

    boards_count = boards.length;
    for (var i = 0; i < boards_count; i++) {
      board = boards[i];
      this.echo(board['board_url']);
    }

  this.exit();

  }, function timeout() {
}, 1800000); // allow timeout of 30 minutes to execute the script...

casper.run();

