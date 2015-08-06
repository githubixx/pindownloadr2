#!/usr/bin/env python

import requests
import os
import errno
import sys
import argparse
import collections
import itertools
import subprocess as sp
import shutil
import locale

import logging

from os.path import expanduser

try:
    # Python 3
    import configparser as cp
except ImportError:
    # Python 2
    import ConfigParser as cp

try:
    # Python 3
    from urllib.request import urlopen
except ImportError:
    # Python 2
    from urllib2 import urlopen

try:
    # Python 3
    import http.client as http_client
except ImportError:
    # Python 2
    import httplib as http_client

# Enables requests lib debugging.
# Remove """ if needed
"""
http_client.HTTPConnection.debuglevel = 1
logging.basicConfig()
logging.getLogger().setLevel(logging.DEBUG)
requests_log = logging.getLogger("requests.packages.urllib3")
requests_log.setLevel(logging.DEBUG)
requests_log.propagate = True
"""

# HTTP Header for our "browser"
http_request_header = {'User-Agent': 'Mozilla/5.0 (Windows NT 6.3; rv:36.0) Gecko/20100101 Firefox/36.0',
                       'Accept-Encoding': 'gzip, deflate',
                       'Accept-Language': 'en-US,en;q=0.5'}


def ensure_save_path(save_path):
    """Ensure that the path to save directories and pictures in exists."""
    try:
        os.makedirs(save_path)
    except OSError as exc:  # Python >2.5
        if exc.errno == errno.EEXIST:
            pass
        else:
            raise


def download_image(url, download_dir='/tmp'):
    """Download the image."""

    # Get image name from url and remove whitespace/newline at the end
    image_name = url.rsplit("/", 1)[1]

    # Change path to point the originals (the big pictures instead of the small ones...)
    originals_url = url.replace("236x", "originals")

    # Check if image already exists
    image_path = download_dir + "/" + image_name
    if os.path.exists(image_path):
        print("Skipping " + image_path + ". File exists!")
        return

    r = requests.get(originals_url, headers=http_request_header, stream=True)
    with open(image_path, 'wb') as out_file:
        shutil.copyfileobj(r.raw, out_file)
    del r


def casperjs_output_as_list(uri, loginname, loginpw, cookiepath):
    """Read CasperJS output and add every line it to a python list."""

    _urls = []

    _p = sp.Popen(["casperjs", "--engine=slimerjs", "/usr/local/bin/pindownloadr2.js", "--uri="+uri,
                   "--loginname="+loginname, "--loginpw="+loginpw, "--cookiefile="+cookiepath],
                   stdin=sp.PIPE, stdout=sp.PIPE, close_fds=True)
    _output = _p.stdout.readlines()

    for _url in _output:
        # convert to unicode string, using locale.getpreferredencoding() and remove newline character
        _urls.append(_url.decode(locale.getpreferredencoding()).rstrip())

    return _urls


def config_section_map(section):
    """Read configuration options."""

    dict1 = {}
    options = config.options(section)
    for option in options:
        try:
            dict1[option] = config.get(section, option)
        except:
            dict1[option] = None
    return dict1


if __name__ == "__main__":

    # Parse commandline options
    ap = argparse.ArgumentParser(description="Fetch pinterest images. USE THIS SCRIPT CAREFULLY!")
    ap.add_argument('--uri',    '-u', dest='uri',     help='The uri (e.g. https://www.pinterest.com/jaymenicoleh/future-home/ - \
                                                            /jaymenicoleh/future-home/ is the one you need.')
    ap.add_argument('--path',   '-p', dest='path',    help='Directory to save the pictures. If directory /path/user/board/ \
                                                            exists the script will only download pictures that does \
                                                            not exist (which is basically "only get new pictures".')
    ap.add_argument('--config', '-c', dest='config',  help='Path to config file (login data for pinterest.com \
                                                            (defaults to $HOME/.pindownloadr)')
    args = ap.parse_args()

    # Uri
    if args.uri is not None:
        uri = args.uri
    else:
        print("No URI provided!")
        sys.exit(1)

    # Where to store pictures?
    if args.path is not None:
        download_dir = args.path + uri
    else:
        print("No path where to save pictures given!")
        sys.exit(1)

    # Config file
    if args.config is not None:
        config_file = os.path.join(args.config, '.pindownloadr/config')
        cookiepath = os.path.join(args.config, '.pindownloadr/cookie')
    else:
        config_file = os.path.join(expanduser("~"), '.pindownloadr/config')
        cookiepath = os.path.join(expanduser("~"), '.pindownloadr/cookie')

    # Load config
    config = cp.ConfigParser()
    config.read(config_file)
    loginname = config_section_map('login')['loginname']
    loginpw = config_section_map('login')['loginpw']

    # Check config values
    if loginname is None:
        print ("No loginname in configuration file found!")
    if loginpw is None:
        print ("No loginpw (login password) in configuration file found!")

    print("")
    print("Fetching image links... This could take some time (depends mostly on your wire speed)!")
    print("")

    # Read links from CasperJS output
    casperjs_links = casperjs_output_as_list(uri, loginname, loginpw, cookiepath)

    # Any pins (maybe board deleted...)?
    if len(casperjs_links) < 2:
        print("Seems that this board was deleted or other problem! Output from CasperJS:")
        print()
        print(casperjs_links)
        print()
        sys.exit(1)

    print("Found " + str(len(casperjs_links)) + " images. Starting download...")

    # Create directory where to save pictures
    ensure_save_path(download_dir)

    # Now fetch original images
    for picture_url in casperjs_links:

        if picture_url.find("/236x") != -1:
            download_image(picture_url, download_dir)

        else:
            print("Skipping URL: " + picture_url)
