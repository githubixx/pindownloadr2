// Global variable to store the image urls
var links = [];

// Pinterest board url
var board_url = "";

/**
Size of the browser i.e. viewport. I know this is ugly but it works 
if you fetch boards with less than 5000 images. The more images the
longer it takes to "render" the viewport. 2000 images takes about 
2 min. to create the viewport... I'm to lazy to implement a "scroller" ;-)
**/
var view_width = 2880, view_height = 200000;

/**
Load casper with defined viewport and user-agent.
**/
var casper = require('casper').create({
    logLevel: 'error',
    verbose: true,
    viewportSize: {width: view_width, height: view_height},
    pageSettings: {
        userAgent: "Mozilla/5.0 (Windows NT 6.2; WOW64; rv:22.0) Gecko/20100101 Firefox/22.0"
    }
});

/**
Commandline options
**/

// Don't need this
casper.cli.drop("cli");
casper.cli.drop("casper-path");

// Any arguments options passed?
if (Object.keys(casper.cli.options).length === 0) {
    casper.echo("Usage: --url=<pinterest_board_url>").exit();
}

// Get URL of pinterest board
if (casper.cli.has("url")) {
    board_url = casper.cli.get("url");
} else {
    casper.echo("No pinterest board url given!").exit();
}

/**
Get all images who's parent is a div. This gives you links to images like this
http://media-cache-ec0.pinimg.com/236x/b0/a1/0f/b0a10fac33057b48a2587763eb861606.jpg
If you change 236x to 736x you get the links to bigger images:
http://media-cache-ec0.pinimg.com/736x/b0/a1/0f/b0a10fac33057b48a2587763eb861606.jpg
And to fetch the originals replace 236x with originals:
http://media-cache-ec0.pinimg.com/originals/b0/a1/0f/b0a10fac33057b48a2587763eb861606.jpg
**/
function getImageLinks() {
    var links = document.querySelectorAll('div>img');
    return Array.prototype.map.call(links, function(e) {
        return e.getAttribute('src');
    });
}

/**
Open the board url..
**/
casper.start(board_url);

/**
... and evaluate the page.
**/
casper.then(function() {
    links = this.evaluate(getImageLinks);
});

/**
Print the result.
**/
casper.then(function() {
    // this.echo(links.length + ' links found:');
    links_count = links.length;
    for (var i = 0; i < links_count; i++) {
        this.echo(links[i]);
    }    
});

/**
Say good night, Gracie ;-)
**/
casper.run(function() {
    this.exit();
});
