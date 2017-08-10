# pindownloadr2

**Be carefull with this script! Since you login with your account Pinterest may lock your account if you download to much images at once! You've been warned...**

This script let's you download the big pictures from pinterest.com. The easiest way to use this script is via Docker and Docker Compose because of the dependencies. If you do not want to use Docker look at the **Dockerfile** files. You can use all the instructions with a plain Ubuntu 16.04 installation since the container runs with Ubuntu 16.04 (the pindownloadr2.py Python script is only tested with Python 3).

**FYI:** Pinterest changes it's site about 1-2 times a week which sometimes requires changes in the `pinlinkfetcher.js` file. So check back to my Github page if it doesn't work for you anymore. I try to keep up with the changes.

First clone the Git repository:

```
git clone https://github.com/githubixx/pindownloadr2 
cd pindownloadr2
```

Instructions for using pindownloadr2 with Docker: Make sure you have [Docker](https://www.docker.io) >= 1.10.0 and [Docker Compose](https://docs.docker.com/compose/install/) >= 1.6.0 installed. Open the **docker-compose.yml** file if you want to change the build settings but it should work with the default values.

To build the container needed use the following commands:

```
docker-compose -f docker-compose-pindownloadr.yml build
docker-compose -f docker-compose-pinlinkfetcher.yml build
```

Now we need to start two container:

```
docker-compose -f docker-compose-chrome-headless.yml up -d
docker-compose -f docker-compose-pinlinkfetcher.yml up -d
```

The first contains a headless Chrome browser listening on port 9222. The second contains a NodeJS app (listening on port 3000) that starts a small webserver, waits for requests and fetches the image URLs but don't download the images. This is the job of the **pindownloadr** container. You can either supply the necessary arguments like so:

```
docker-compose -f docker-compose-pindownloadr.yml run --rm pindownloadr --scraper localhost:3000 --loginname <your_login_mail_address> --loginpw <your_login_password> --country <your_country> --uri <user/board>
```

Or if you don't want to provide the arguments all the time add them to `docker-compose-pindownloadr.yml`. The file contains examples you need to comment out and adjust the values accordingly. Here are the arguments in more detail:

**--rm pindownloadr** That're arguments to docker-compose command which tells Docker compose the name of the container and to delete the container after the run (--rm).

**--scraper** The address where the scraper service is running. In **docker-compose-pinlinkfetcher.yml** a container **pinlinkfetcher** is defined. Per default it listens on **localhost:3000**. That's the IP:PORT you need to specify here. It only extracts the image url's but doesn't download the images.

**--loginname** Your Pinterest login name or login email (does NOT work with Facebook/Twitter login!).

**--loginpw** Your Pinterest password.

**--country** Pinterest added redirects to country specific domains. E.g. if you live in Germany and enter `https://www.pinterest.com/login` you will be redirected to `https://www.pinterest.de/`. In this case `de` is the country code you need to specify here. For most people out there I guess it will be still simply `com` but I can't test as Pinterest is doing this redirects based on GeoIP matching I guess. Simply login to Pinterest with your prefered webbrowser and see to which country domain you will be redirected and use this value here.

**--uri** The board you want to download. E.g. if the original URL is `https://www.pinterest.com/misssabine/wedding-the-flowers/` the value of the `--uri` parameter would be `misssabine/wedding-the-flowers` (no / at the beginning and the end!).

If you run the `pindownloadr` container the images will be stored in **/tmp/user/board**. But since the container will be deleted after it's finished and /tmp is "inside" the container in this case you won't see any downloaded images. To avoid this the **docker-compose-pindownloadr.yml** includes a volume parameter. Adjust the **docker-compose-pindownloadr.yml** **volume** setting accordingly if you like. If you don't change the setting the pictures will be stored in **/tmp/user/board**.  E.g. if the specified URI was `--uri misssabine/wedding-the-flowers` the images will be stored in `/tmp/misssabine/wedding-the-flowers/`. The script will only download images not already stored in the directory.

Be aware that the download speed depends on your wire speed (I've also observed that Pinterest is VERY slow if you use IPv6... So maybe disable it.). Since the script needs to "scroll down" (like a real user) through all pages of a board (it uses chromless and Google Chrome to emulate a real Chrome browser) and needs to wait until every page is loaded, extracting the image URL's afterwards takes time. The more pins a board has the longer it takes to extract all image URL's. And often Pinterest is very unstable and slow. So sometimes you get only part of the images. Just start fetching the same URL again. But for very big boards (more then 5000 pins e.g.) you maybe won't get all images (but the new implementation with chromeless and Chrome could raise the limit if the timeout values are high enough - needs to be tested).

The scripts are also do very little error handling. Simply to lazy to implement :-) So you may get strange error messages... The whole thing *just works for ME* ;-)
