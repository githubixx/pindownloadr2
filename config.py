import os                                                                                                                                                                                   
                                                                                                                                                                                            
class BaseConfig(object):                                                                                                                                                                   
  APP_ROOT = os.path.dirname(os.path.realpath(__file__))                                                                                                                                    
                                                                                                                                                                                            
  IMAGES_ROOT = os.path.join(APP_ROOT, 'images')                                                                                                                                             
                                                                                                                                                                                            
  CASPERJS_BIN = '/usr/local/bin/casperjs'
  PINLINKFETCHER_SCRIPT = os.path.join(APP_ROOT, 'pinlinkfetcher.js')
