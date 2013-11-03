# pindownloadr2

Let's you download the big pictures from pinterest.com. To use the PINterest image DOWNLOADeR2 (Version 1 didn't worked anymore since pinterest now depends extremly on JavaScript) you need to install some dependencies. You need Python >= V2.6.

## Hint
You can download about 5000 images per board. If the board has more images you have to adjust the viewport height in pindownloadr2.js!

## Installation

### If you're using Python < 2.7:
pip install argparse

### Install Python requests and pillow (PIL fork):
pip install requests  
pip install pillow (make sure libjpeg-dev is installed before!)

### Install the git package 
Ubuntu: apt-get install git-core  
Gentoo: emerge -av git

### Install PhantomJS 1.8.x (needed for CasperJS):
cd /opt/src (for e.g.).  
wget http://phantomjs.googlecode.com/files/phantomjs-1.8.2-linux-x86_64.tar.bz2  
tar xvfj phantomjs-1.8.2-linux-x86_64.tar.bz2  
ln -s /opt/src/phantomjs-1.8.2-linux-x86_64/bin/phantomjs /usr/local/bin/phantomjs  
Test if phantomjs is in path and is executable: phantomjs --version

### Install CasperJS 1.1.x
cd /opt/src  
mkdir casperjs-1.1.0  
cd casperjs-1.1.0  
git clone git://github.com/n1k0/casperjs.git  
ln -s /opt/src/casperjs-1.1.0/casperjs/bin/casperjs /usr/local/bin/casperjs  
Test if casperjs is in path and is executable: casperjs --version

### pindownloadr2
Copy pindownloadr2.js and pindownloadr2.py to e.g. /usr/local/bin/

## Usage example
>> python pindownloadr2.py --url /hinterbrandner/winter/ --path=/opt/pinterest
This will create a directory "/opt/pinterest/hinterbrandner/winter/" where the pictures will be saved.

>> python pindownloadr2.py --update /opt/pinterest/hinterbrandner/winter/ 
This will download only all new images since last download. In this case the pinterest user is "hinterbrandner" and the board is "winter". So for update it is important that /user/board/ are the last two parts of the update path since pindownloadr2 will create the download url from the update path!

