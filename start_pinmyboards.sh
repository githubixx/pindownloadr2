#!/bin/bash

# Set path
export PATH=/usr/local/sbin:/usr/local/bin:/usr/bin:/bin

# start Xvfb
if [ ! $RESOLUTION ];
then
  export RESOLUTION="1920x1280x24"
fi;

/usr/bin/Xvfb :99 -ac -screen 0 $RESOLUTION 1>/dev/null 2>&1 &
export DISPLAY=:99.0

# Tell SlimerJS where to find Firefox (just to be sure...)
export SLIMERJSLAUNCHER=/usr/local/bin/firefox

# Start
cd /usr/local/bin
/usr/local/bin/casperjs --engine=slimerjs --load-images=false /usr/local/bin/pinmyboards.js -- --username=$USERNAME --loginname=$LOGINNAME --loginpw=$LOGINPW
