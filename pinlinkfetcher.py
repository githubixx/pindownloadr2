###########################################
#
# Small Flask service fetching links to
# big pictures from a pinterest board.
#
# FYI: This code just works somehow ;-)
#      Definitely not a good example of
#      good style or whatever... Only
#      bare minimum error handling!
#
###########################################

import os                                                                                                                                                                                   
import subprocess

from flask import Flask, abort
from config import BaseConfig

# Create our flask app
app = Flask(__name__)

# Configure flask app
app.config.from_object(BaseConfig)

#
# Fetch image links via CasperJS
#
@app.route("/pinlinkfetcher/<string:loginname>/<string:loginpw>/<path:url>")
def pinlinkfetcher(loginname, loginpw, url):

  # Add a / at start and end of url if needed
  if not url.startswith("/"):
    url = "/" + url
  if not url.endswith("/"):
    url = url + "/"

  casper_cmd = [BaseConfig.CASPERJS_BIN, '--engine=slimerjs', BaseConfig.PINLINKFETCHER_SCRIPT, '--url='+url, '--loginname='+loginname, '--loginpw='+loginpw]

  try:
    output = subprocess.run(casper_cmd, stdout=subprocess.PIPE, universal_newlines=True)
  except:
    abort(500)

  return output.stdout

#
# Main
#
if __name__ == '__main__':
  _debug = os.getenv('DEBUG') == False
  _port = int(os.getenv('PORT', 9090))
  _host = os.getenv('HOST', '0.0.0.0')

  app.run(host=_host, port=_port, debug=_debug)

