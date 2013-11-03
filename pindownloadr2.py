import requests
import os
import errno
import sys
import argparse
import subprocess as sp

from PIL import Image
from StringIO import StringIO

# Images found
images_found = 0

# HTTP Header for our "browser"
http_request_header = {'User-Agent': 'Mozilla/5.0 (Windows NT 6.2; WOW64; rv:22.0) Gecko/20100101 Firefox/22.0',
                       'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                       'Accept-Encoding': 'gzip, deflate',
                       'Accept-Language': 'en-US,en;q=0.5'}

def ensure_save_path(save_path):
    try:
        os.makedirs(save_path)
    except OSError as exc:  # Python >2.5
        if exc.errno == errno.EEXIST:
            pass
        else:
            raise

def generate_save_path(save_path, board_url):
    split_path = board_url.split(os.sep)
    split_path.pop()
    board_name = split_path.pop()
    pinterest_user = split_path.pop()
    return os.path.join(save_path, pinterest_user, board_name)

def download_image(url, save_path='/tmp'):
    '''
    Download a image.
    '''
    # Get image name from url
    image_name = url.rsplit("/",1)[1]

    # Change path to point the originals
    new_url = url.replace("236x", "originals")

    # Check if image already exists
    image_name_tmp = image_name.split(".",1)[0]

    image_extensions = ["jpg", "gif", "png"]
    for extension in image_extensions:
        image_path = save_path + "/" + image_name_tmp + "." + extension
        if os.path.exists(image_path):
            print("Skipping " + image_name_tmp + "." + extension + ". File exists!")
            return

    print("Downloading " + image_name)
    r = requests.get(new_url, headers=http_request_header)

    i = Image.open(StringIO(r.content))

    # We need to do this because the image extension says us all
    # images are JPEG but some images are GIF, PNG, ...
    if (i.format == "JPEG"):
        i.save(os.path.join(save_path, image_name))
    elif (i.format == "GIF"):
        image_name = image_name.replace(".jpg", ".gif")
        i.save(os.path.join(save_path, image_name))
    elif (i.format == "PNG"):
        image_name = image_name.replace(".jpg", ".png")
        i.save(os.path.join(save_path, image_name))
    else:
        print("Skipping " + new_url + ". Unknown format!")

def casperjs_output_as_list(url):
    '''
    Read output of links from CasperJS and add it into a python list.
    '''
    link_list = []
    p = sp.Popen(["/usr/local/bin/casperjs", "/usr/local/bin/pindownloadr2.js", "--url=" + url], stdin=sp.PIPE, stdout=sp.PIPE, close_fds=True)
    (stdout, stdin) = (p.stdout, p.stdin)
    data = stdout.readline()
    while data:
        data = stdout.readline().rstrip('\n')
        link_list.append(data)
    return link_list

if __name__ == "__main__":

    # Parse commandline options
    ap = argparse.ArgumentParser(description="Fetch pinterest images. USE THIS SCRIPT CAREFULLY!")
    ap.add_argument('--url', '-u', dest='board_url', help='The board url to download (e.g. /<username>/<boardname>/)')
    ap.add_argument('--path', '-p', dest='save_path', help='Directory to save the pictures.')
    ap.add_argument('--update', dest='save_path', help='The path to update.')
    args = ap.parse_args()

    # Board url
    if args.board_url is not None:
        board_url = args.board_url[0]
        if not board_url.endswith("/"):
            board_url = board_url + "/"
        if board_url.startswith("http:"):
            print("Only /<username>/<boardname>/ for url argument please!")
            sys.exit(1)

    if args.save_path is not None:
        save_path_tmp=args.save_path
    else:
        print("No path to save given!")
        sys.exit(1)

    if save_path_tmp is not None and args.board_url is None:
        _update_path_tmp = save_path_tmp.split("/")
        if len(_update_path_tmp) < 4:
            print("Update path needs at least two path elements e.g. /user/board/ !")
            sys.exit(1)
        else:
            _user = _update_path_tmp[len(_update_path_tmp) - 3]
            _board = _update_path_tmp[len(_update_path_tmp) - 2]
            board_url = "/" + _user + "/" + _board + "/"
            save_path_tmp=save_path_tmp.replace(board_url, "")

    # Generate path for pictures
    save_path = generate_save_path(save_path_tmp, board_url)

    # Ensure that picture directory exists
    ensure_save_path(save_path)

    print("")
    print("Fetching image links... This could take some time (depends on your wire speed)!")
    print("")

    # Read in links to 236x images from CasperJS
    casper_links = casperjs_output_as_list("http://www.pinterest.com" + board_url)

    print("Found " + str(len(casper_links)) + " images. Starting download...")

    # Board deleted?
    if len(casper_links) < 2:
        print("Seems that this board was deleted or other problem!")
        sys.exit(1)

    # Now fetch original images
    for image_link in casper_links:
        if "/236x" in image_link:
            download_image(image_link, save_path)
        else:
            print("Skipping URL: " + image_link)
