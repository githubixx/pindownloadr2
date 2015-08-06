//
// Imports
//
var fs = require('fs');


//
// Some default variables
//
var log_level = 'error';
var verbose = false;
var viewport_width = 1280;
var viewport_height = 960;
var login_url = 'https://www.pinterest.com/login/';
var user_agent = 'Mozilla/5.0 (Windows NT 6.3; rv:36.0) Gecko/20100101 Firefox/36.0';

var uri = '';
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
// At least we need a URI, Pinterest login name and password and where to save the cookie file
//
if (Object.keys(casper.cli.options).length < 3) {
    casper.echo("Need more options!");
    casper.echo("");
	casper.echo("Example : casperjs pindownloadr2.js --uri=uri                              [required, e.g. /jaymenicoleh/future-home/]");
	casper.echo("                                    --loginname=loginname                  [required]");
	casper.echo("                                    --loginpw=loginpassword                [required]");
	casper.echo("                                    --cookiefile=/path/to/cookiefile       [required]");
    casper.echo("");
    casper.echo("INFO: Does not work with Facebook login!");
    casper.echo("");
	casper.exit();
}

//
// Set the useragent we use to connect to pinterest.com.
//
casper.userAgent(user_agent);

//
// Get CLI options
//
if(casper.cli.has("uri")) {
    var uri = casper.cli.get("uri");
} else {
    casper.echo("Missing path to board (--uri)!");
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

if(casper.cli.has("cookiefile")) {
    var cookiefile = casper.cli.get("cookiefile");
} else {
    casper.echo("Missing cookiefile (--cookiefile)!");
    casper.exit();
}

//
// Read cookie file if it exists
//
if (fs.exists(cookiefile)) {
    var cookies = fs.read(cookiefile);
    phantom.cookies = JSON.parse(cookies);

    // Directly request uri to download
    casper.start('https://www.pinterest.com' + uri, function() {
        var html = this.getHTML();
    });
} else {
    // Without cookie file we first need to login
    casper.start(login_url, function() {
        this.fill('body > div.App.AppBase.Module.content_only > div.appContent > div.mainContainer > div > div > div > form', {
            username_or_email: loginname,
            password: loginpw
        }, true);
    });

    casper.thenOpen('https://www.pinterest.com' + uri, function() {
        var html = this.getHTML();

        // Save cookies after login
        var cookies = JSON.stringify(phantom.cookies);
        fs.write(cookiefile, cookies, 644);
    });

}


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
        
        var pUrls = $('.pinImageWrapper');
        var pDescriptions = $('.pinImg');
        var pBoard = $('.creditTitle');
	    var pBoardUri = $('.creditItem > a');

        pLength = parseInt($('.padItems').css('height').replace('px', ''));

        if (pLength == pLastCount) {
            window.clearInterval(pTimer);
            window.done = 1;
        } else {
            for ( var i=0 ; i < pUrls.length ; i++) {
                var pPin = {};
                pPin['pin_page'] = 'http://www.pinterest.com'+$(pUrls[i]).attr('href');
                pPin['board'] = $(pBoard[i]).text();
                pPin['description'] = $(pDescriptions[i]).attr('alt');
                pPin['pin_thumbnail'] = $(pDescriptions[i]).attr('src');
		        pPin['pin_board_uri'] = $(pBoardUri[i]).attr('href');

                // search if pin already pushed
                if (!(pPin['pin_page'] in pPinsIndexes)) {
                    window.data.push(pPin); 
                    pPinsIndexes[pPin['pin_page']] = '';
                }
            }

            pLastCount = pLength;

            //
            // The following codelines doesn't work with headless (PhantomJS) browser (but some with SlimerJS).
            // If someone knows how to scroll to next page with PhantomJS/CasperJS please
            // send a pull request ;-) It seems that the window object doesn't exist in PhantomJS.
            //
            // window.document.body.scrollTop = document.body.scrollHeight;
            // window.scrollTo(0,document.body.scrollHeight || document.documentElement.scrollHeight);
            // window.scrollTo(0,document.body.scrollHeight);

            // Works only with Firefox (SlimerJS) but isn't very nice.
            // window.scrollByPages(1);

            // This finally works with SlimerJS (Gecko) and CasperJS scrollTo function. That's the reason we
            // use SlimerJS instead of PhantomJS.
            this.scrollTo(0,document.body.scrollHeight);
            pTimerCounter++;

        }
    }, 3000);  // use high values like 6000 ms to wait for next page
               // to reduce possibility that fetching images stops to early.
               // This value depends on your wire speed and the response time
               // from pinterest.com.
});

//
// Wait for global variable "done" and print collected image uri's
//
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
