#!/bin/bash

# start Xvfb
if [ ! $RESOLUTION ];
then
  export RESOLUTION="1024x768x24"
fi;

/usr/bin/Xvfb :99 -ac -screen 0 $RESOLUTION 1>/dev/null 2>&1 &
export DISPLAY=:99.0

# Path to save images will always be overriden in container to ensure
# consistent path for Docker host mount.
pindownloadr2.py $* --path=/opt/images

