#!/usr/bin/env python3

"""
FYI: This code just works somehow ;-) Definitely not a good example of
     good style or whatever... Only bare minimum error handling!

     This code was developed with Python 3.5 and I don't care about 
     Python 2.7 since it is intended to run inside a container where
     we can use whatever Python version we want.
"""

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
import http.client as http_client

from os.path import expanduser
from urllib.request import urlopen
from urllib.request import unquote

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
http_request_header = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64; rv:46.0) Gecko/20100101 Firefox/46.0',
                       'Accept-Encoding': 'gzip, deflate',
                       'Accept-Language': 'en-US,en;q=0.5'}


def ensure_save_path(save_path):
  """Ensure that the path to save the images exists."""

  try:
    os.makedirs(save_path)
  except OSError as exc:
    if exc.errno == errno.EEXIST:
      pass
    else:
      raise


def download_image(url, download_dir='/tmp'):
  """Download an image."""

  # Get image name from url and remove whitespace/newline at the end
  image_name = url.rsplit("/", 1)[1]

  # Change path to point the originals (the big pictures instead of the small ones...)
  originals_url = url.replace("474x", "originals").replace("236x", "originals")

  # Check if image already exists
  image_path = download_dir + "/" + image_name
  if os.path.exists(image_path):
    print("Skipping " + image_path + ". File exists!")
    return

  try:
    r = requests.get(originals_url, headers=http_request_header, stream=True)
    with open(image_path, 'wb') as out_file:
      shutil.copyfileobj(r.raw, out_file)
    print("Downloaded :" + image_path)
    del r
  except:
    print("Error while downloading: " + image_path + " (skipping image...)")


def get_image_urls(host, loginname, loginpw, uri):
  """Get image URLs from CasterJS service."""

  _urls = []

  _casper_service_url = "http://" + host + "/pinlinkfetcher/" + loginname + "/" + loginpw + "/" + uri

  _r = requests.get(_casper_service_url, headers=http_request_header)
  for _line in _r.iter_lines():
    if _line:
      _urls.append(_line)

  return _urls

#
# Main
#
if __name__ == "__main__":

  # Parse commandline options
  ap = argparse.ArgumentParser(description="Fetch pinterest images. USE THIS SCRIPT CAREFULLY!")
  ap.add_argument('--cshost', '-c', dest='host', help='The host where the CasperJS service listens e.g. localhost:9090 (do NOT add http:// just the host:port)')
  ap.add_argument('--loginname', '-n', dest='loginname', help='Your pinterest loginname (e-mail address)')
  ap.add_argument('--loginpw',   '-w', dest='loginpw',   help='Your pinterest login password')
  ap.add_argument('--uri',       '-u', dest='uri',       help='The uri (e.g. https://www.pinterest.com/jaymenicoleh/future-home/ - \
                                                               jaymenicoleh/future-home is the one you need.')
  ap.add_argument('--path',      '-p', dest='path',      help='Directory to save the pictures. If directory /path/user/board/ \
                                                               exists the script will only download pictures that does \
                                                               not exist (which is basically "only get new pictures".')

  args = ap.parse_args()

  # CasperJS host
  if args.host is not None:
    host = args.host
  else:
    print("No CasperJS host provided!")
    sys.exit(1)

  # Login name
  if args.loginname is not None:
    loginname = args.loginname
  else:
    print("Loginname missing!")
    sys.exit(1)

  # Login password
  if args.loginpw is not None:
    loginpw = args.loginpw
  else:
    print("Login password missing!")
    sys.exit(1)

  # Uri
  if args.uri is not None:
    uri = args.uri
  else:
    print("No URI provided!")
    sys.exit(1)
  
  # Where to store pictures?
  if args.path is not None:
    download_dir = args.path + "/" + uri
  else:
    download_dir = "/tmp/" + uri

  print("")
  print("Fetching image links... This could take some time!")
  print("Download depends how much pins a board has and how")
  print("fast your Internet connection is.")
  print("")

  # Read links from CasperJS output
  image_links = get_image_urls(host, loginname, loginpw, uri)

  # Any pins (maybe board deleted...)?
  if len(image_links) < 2:
    print("Seems that this board was deleted or other problem! Output from CasperJS:")
    print()
    print(image_links)
    print()
    sys.exit(1)

  print("Found " + str(len(image_links)) + " images. Starting download...")

  # Create directory where to save pictures
  ensure_save_path(download_dir)

  # Now fetch original images
  for picture_url in image_links:
    _picture_url_str = unquote(picture_url.decode()).strip()
    if _picture_url_str.find("/474x") != -1:
      download_image(_picture_url_str, download_dir)
    elif _picture_url_str.find("/236x") != -1:
      download_image(_picture_url_str, download_dir)
    else:
      print("Skipping URL: " + _picture_url_str)

