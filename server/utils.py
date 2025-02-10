from flask import Flask
from flask_restful import Resource, Api

HEADSTRING = "mongodb://"
base_url = "localhost:"
port = "27017"


connection_string = HEADSTRING + base_url + port