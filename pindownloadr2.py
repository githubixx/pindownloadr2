#!/usr/bin/env python3

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
http_request_header = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64; rv:52.0) Gecko/20100101 Firefox/52.0',
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
  image_path = os.path.join(os.path.sep, download_dir, image_name)
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


def get_image_urls(scraper, loginname, loginpw, country, uri):
  """Get image URLs from scraper service."""
  urls = []

  pinlinkfetcherUrl = "http://" + scraper + "/pinlinkfetcher/loginname/" + loginname + "/loginpw/" + loginpw + "/countrydomain/" + country + "/board/" + uri

  response = requests.get(pinlinkfetcherUrl, headers=http_request_header)
  for item in response.json():
    urls.append(item)

  return urls

#
# Main
#
if __name__ == "__main__":

  # Parse commandline options
  ap = argparse.ArgumentParser(description="Fetch pinterest images. USE THIS SCRIPT CAREFULLY!")
  ap.add_argument('--scraper',   '-s', dest='scraper',   help='The host where the scraper service listens e.g. localhost:3000 (do NOT add http:// just the host:port)')
  ap.add_argument('--loginname', '-n', dest='loginname', help='Your pinterest loginname (e-mail address)')
  ap.add_argument('--loginpw',   '-w', dest='loginpw',   help='Your pinterest login password')
  ap.add_argument('--country',   '-y', dest='country',   help='Your pinterest country domain e.g com|de|...')
  ap.add_argument('--uri',       '-u', dest='uri',       help='The uri (e.g. https://www.pinterest.com/jaymenicoleh/future-home/ - \
                                                               jaymenicoleh/future-home is the one you need).')
  ap.add_argument('--path',      '-p', dest='path',      help='Directory to save the pictures. If directory /path/user/board/ \
                                                               exists the script will only download pictures that does \
                                                               not exist (which is basically "only get new pictures").')

  args = ap.parse_args()

  # Scraper host
  if args.scraper is not None:
    scraper = args.scraper
  elif os.environ['SCRAPER'] is not None:
    scraper = os.environ['SCRAPER']
  else:
    print("No scraper host provided!")
    sys.exit(1)

  # Login name
  if args.loginname is not None:
    loginname = args.loginname
  elif os.environ['LOGINNAME'] is not None:
    loginname = os.environ['LOGINNAME']
  else:
    print("Loginname missing!")
    sys.exit(1)

  # Login password
  if args.loginpw is not None:
    loginpw = args.loginpw
  elif os.environ['LOGINPW'] is not None:
    loginpw = os.environ['LOGINPW']
  else:
    print("Login password missing!")
    sys.exit(1)

  # Country domain
  if args.country is not None:
    country = args.country
  elif os.environ['COUNTRY'] is not None:
    country = os.environ['COUNTRY']
  else:
    print("Country domain is missing!")
    sys.exit(1)

  # Uri
  if args.uri is not None:
    uri = args.uri.strip("/")
  elif os.environ['URI'] is not None:
    uri = os.environ['URI'].strip("/")
  else:
    print("No URI provided!")
    sys.exit(1)
  
  # Where to store pictures?
  if args.path is not None:
    _path = args.path.strip("/")
    download_dir = os.path.join(os.path.sep, _path, uri)
  else:
    download_dir = os.path.join(os.path.sep, "tmp", uri)

  print("")
  print("Fetching image links... This could take some time!")
  print("Download depends how much pins a board has and how")
  print("fast your Internet connection is.")
  print("")

  # Fetch links
  image_links = get_image_urls(scraper, loginname, loginpw, country, uri)

  # Any pins (maybe board deleted...)?
  if len(image_links) < 2:
    print("Could not find any image links or maybe other problem occured!")
    print()
    print(image_links)
    print()
    sys.exit(1)

  print("Found " + str(len(image_links)) + " images. Starting download...")

  # Create directory where to save pictures
  ensure_save_path(download_dir)

  # Now fetch original images
  for picture_url in image_links:
    _picture_url_str = picture_url.strip()
    if _picture_url_str.find("/474x") != -1:
      download_image(_picture_url_str, download_dir)
    elif _picture_url_str.find("/236x") != -1:
      download_image(_picture_url_str, download_dir)
    else:
      print("Skipping URL: " + _picture_url_str)

