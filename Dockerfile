FROM ubuntu:16.04

MAINTAINER Robert Wimmer <docker@tauceti.net>

# Update repository
RUN apt-get update && apt-get upgrade -y

# Add a group/user used to execute pindownloadr
RUN groupadd -g 1000 pdown; \
    useradd -m -u 1000 -g pdown -s /bin/bash -d /home/pdown pdown

# Create directory for pindownloadr config
RUN mkdir /home/pdown/.pindownloadr
RUN chown pdown.pdown /home/pdown/.pindownloadr

# Install packages
RUN apt-get install -y build-essential g++ flex bison gperf ruby perl libsqlite3-dev libfontconfig1-dev libicu-dev libfreetype6 libssl-dev libpng-dev libjpeg-dev python libx11-dev libxext-dev python3-pip git wget unzip libc6 libstdc++6 libgcc1 libgtk-3-common libasound2 libxrender1 xvfb libdbus-glib-1.2

# Locale
RUN locale-gen en_US.UTF-8
ENV LANG en_US.UTF-8
ENV LANGUAGE en_US:en
ENV LC_ALL en_US.UTF-8

# Get jquery
RUN wget -O /usr/local/bin/jquery-3.1.0.min.js https://code.jquery.com/jquery-3.1.0.min.js

# Install Firefox - we need Firefox <= 46 because it's the latest supported by SlimerJS
RUN cd /opt/; \
    wget https://download-installer.cdn.mozilla.net/pub/firefox/releases/46.0.1/linux-x86_64/en-US/firefox-46.0.1.tar.bz2 ; \
    tar xvfj firefox-46.0.1.tar.bz2; \
    ln -s /opt/firefox/firefox /usr/local/bin/firefox

# Install SlimerJS
RUN cd /opt; \
    wget -O /opt/slimerjs-0.10.0.zip http://download.slimerjs.org/releases/0.10.0/slimerjs-0.10.0.zip; \
    unzip slimerjs-0.10.0.zip; \
    chmod 755 /opt/slimerjs-0.10.0/slimerjs; \
    ln -s /opt/slimerjs-0.10.0/slimerjs /usr/local/bin/slimerjs

# Install CasperJS
RUN cd /opt; \
    wget -O /opt/casperjs-1.1-3.zip https://github.com/casperjs/casperjs/archive/1.1.3.zip; \
    unzip casperjs-1.1-3.zip; \
    chmod 755 /opt/casperjs-1.1.3/bin/casperjs; \
    ln -s /opt/casperjs-1.1.3/bin/casperjs /usr/local/bin/casperjs

# Install python requests module 
RUN pip3 install --upgrade requests

# Copy pindownloadr2 files to container. Do not forget to adjust the "config" file!
ADD pindownloadr2.js /usr/local/bin/pindownloadr2.js
ADD pindownloadr2.py /usr/local/bin/pindownloadr2.py
ADD config /home/pdown/.pindownloadr/config
ADD start.sh /usr/local/bin/start.sh
RUN chmod 755 /usr/local/bin/start.sh
RUN chmod 600 /home/pdown/.pindownloadr/config
RUN chown pdown.pdown /home/pdown/.pindownloadr/config

# Set $HOME since Docker defaults to / as $HOME directory for all users 
ENV HOME /home/pdown 

# Directory for images (the one you'll need to host mount to get the images saved outside the container)
RUN mkdir /opt/images

USER pdown

ENTRYPOINT ["/usr/local/bin/start.sh"]

