# pindownloadr2

**Be carefull with this script! Since you login with your account Pinterest may lock your account if you download to much images at once! You've been warned...**

This script let's you download the big pictures from pinterest.com. The easiest way to use this script is via Docker and Docker Compose because of the dependencies. If you do not want to use Docker look at the **Dockerfile** files. You can use all the instructions with a plain Ubuntu 16.04 installation since the container runs with Ubuntu 16.04. The Python scripts need Python 3.

First clone the Git repository:

```
git clone https://github.com/githubixx/pindownloadr2 
cd pindownloadr2
```

Make sure you have [Docker](https://www.docker.io) >= 1.10.0 and [Docker Compose](https://docs.docker.com/compose/install/) >= 1.6.0 installed. Open the **docker-compose.yml** file if you want to change the build settings but it should work with the default values. 

To build the container needed just use the following command:

```
docker-compose build
```

To start the **pinlinkfetcher** container run:

```
docker-compose up -d
```

This Python Flask app starts a small webserver, wait for requests and fetches the image URLs but don't download the images. This is the job of **pindownloadr**. You can start downloading using the **pindownloadr** container:

```
docker-compose run --rm pindownloadr --cshost localhost:9090 --loginname <your_login_mail_address> --loginpw <your_login_password> --uri <user/board>
```

**--cshost** The CasperJS host. In **docker-compose.yml** a container **pinlinkfetcher** is defined. Per default it listens on **localhost:9090**. That's the IP:PORT you need to specify here. It only extracts the image url's but doesn't download the images.

**--loginname** Your Pinterest login name or login email (does NOT work with Facebook/Twitter login!).

**--loginpw** Your Pinterest password.

**--uri** The board you want to download. E.g. if the original URL is https://www.pinterest.com/misssabine/wedding-the-flowers/ the value of the --uri parameter would be **misssabine/wedding-the-flowers** (no / at the beginning and the end!).

If you run pindownloadr container the images will be stored in **/tmp/user/board**. But since the container will be deleted after it's finished and /tmp is "inside" the container in this case you won't see any downloaded images. To avoid this the **docker-compose.yml** includes a volume parameter. Adjust the **docker-compose.yml** **volume** setting accordingly if you like. If you don't change the setting the pictures will be stored in **/tmp/user/board**.  E.g. if the specified URI was **--uri misssabine/wedding-the-flowers** the images will be stored in **/tmp/misssabine/wedding-the-flowers/**. The script will only download images not already stored in the directory.

Be aware that the download speed depends on your wire speed. Since the script needs to "scroll" through all pages (it uses SlimerJS to emulate a real Firefox browser) and needs to wait until every page is loaded extracting the image URL's takes time. The more pins a board has the longer it takes to extract all image URL's.

The scripts are also do very little error handling. Simply to lazy to implement :-) 

If you want to generate a list of the boards you're following you can use the **pinmyboards** container. In the **docker-compose.yml** you just need to change a few values for the **pinmyboards** service:

```
environment:
  USERNAME: your-username
  LOGINNAME: your-loginname
  LOGINPW: your-password
```

Replace the values accordingly. You can see your **USERNAME** when you open https://www.pinterest.com/settings/ in your browser. In the profile section you'll see your username. As with pindownloadr above **LOGINNAME** is your pinterest login and **LOGINPW** your password (again: does NOT work with Facebook/Twitter login!).

After you changed the settings you just need to start the container:

```
docker-compose run pinmyboards
```

If the run is finished you get a list of the boards you're following.

