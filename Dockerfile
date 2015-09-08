FROM    ubuntu:14.04

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
RUN apt-get install -y build-essential g++ flex bison gperf ruby perl libsqlite3-dev libfontconfig1-dev libicu-dev libfreetype6 libssl-dev libpng-dev libjpeg-dev python libx11-dev libxext-dev python-pip git wget unzip libc6 libstdc++6 libgcc1 libgtk2.0-0 libasound2 libxrender1 xvfb libdbus-glib-1.2

# Locale
RUN locale-gen en_US.UTF-8
ENV LANG en_US.UTF-8
ENV LANGUAGE en_US:en
ENV LC_ALL en_US.UTF-8

# Install CasperJS
RUN mkdir -p /opt/casperjs; \
    cd /opt/casperjs; \
    wget -O /opt/casperjs/1.1-beta3.zip https://github.com/n1k0/casperjs/archive/1.1-beta3.zip; \
    unzip 1.1-beta3.zip; \
    chmod 755 /opt/casperjs/casperjs-1.1-beta3/bin/casperjs; \
    ln -s /opt/casperjs/casperjs-1.1-beta3/bin/casperjs /usr/local/bin/casperjs

# Install SlimerJS
RUN mkdir -p /opt/slimerjs; \
    cd /opt/slimerjs; \
    wget -O /opt/slimerjs/slimerjs-0.9.6-linux-x86_64.tar.bz2 http://download.slimerjs.org/releases/0.9.6/slimerjs-0.9.6-linux-x86_64.tar.bz2; \
    tar xvfj slimerjs-0.9.6-linux-x86_64.tar.bz2; \
    chmod 755 /opt/slimerjs/slimerjs-0.9.6/slimerjs; \
    ln -s /opt/slimerjs/slimerjs-0.9.6/slimerjs /usr/local/bin/slimerjs

# Install python reqests module 
RUN pip install requests

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

