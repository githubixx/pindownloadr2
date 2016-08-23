# pindownloadr2

**Be carefull with this script! Since you login with your account Pinterest may lock your account if you download to much images at once! You've been warned...**

This script let's you download the big pictures from pinterest.com. The easiest way to use this script is via Docker because of the dependencies. If you do not want use Docker look at the **Dockerfile** file. You can use all the instructions with Ubuntu 14.04 since the container runs with Ubuntu 14.04. 

First clone the Git repository:

    git clone https://github.com/githubixx/pindownloadr2 
    cd pindownloadr2

Edit the **config** file:

    loginname: your@email.com
    loginpw: your_super_secret_password

Replace **your@email.com** with your Pinterest login name and **your_super_secret_password** with your login password. Save the file.  Build the Docker image e.g. (do NOT forget the **.** at the end!):

    docker build -t pindownloadr2:latest .
    
Now you can start downloading e.g.:
    
    docker run --rm \
               -t \
               --name=test \
               -v /tmp/images:/opt/images \
               pindownloadr2:latest --uri=/misssabine/wedding-the-flowers/
    
**--rm** deletes the Docker container after execution<br />
**-t** avoids caching of containter output (e.g. see log messages immediately)<br />
**--name=test** just a temp. name for the container<br />
**-v /tmp/images:/opt/images** Inside the container the images are stored in /opt/images. But this directory is "inside" the container. So in this case we basically say Docker to store the pictures on the host in /tmp/images instead of /opt/images inside the container. So after the download you'll find the images in /tmp/images/.<br />
**pindownloadr2:latest** is the name of the image we created when we started the build above. <br />
**--uri=** here you supply the path you want to download. In the example above it's /misssabine/wedding-the-flowers/ (the original URL was https://www.pinterest.com/misssabine/wedding-the-flowers/ and we only need the URI).

In the example above after the download of the images you'll find the images in **/tmp/images/misssabine/wedding-the-flowers/**. If you start the download with the same arguments again the script will only download images not already stored in **/tmp/images/misssabine/wedding-the-flowers/**.

Be aware that the download speed mainly depends on your wire speed.
