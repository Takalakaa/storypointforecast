from flask import Flask, jsonify, request
from flask_restful import Api, reqparse
from flask_cors import CORS
import pymongo
import json
import hashlib
import utils

app = Flask(__name__)
api = Api(app)
CORS(app)

@app.route('/sample_connection', methods=['POST', 'GET'])
def sample_connection():    
    mongo_client = pymongo.MongoClient(utils.connection_string)
    db_access = mongo_client["db"]
    collection_access = db_access["collection"]
    if request.method == "POST":
        sample_data = {
            "author": "Mike",
            "text": "My first blog post!",
            "tags": ["mongodb", "python", "pymongo"],
        }
        response = str(collection_access.insert_one(db_access).inserted_id)
        return response
    else:
        return str(collection_access.find_one())
    
@app.route('/signup', methods=['POST', 'GET'])
def signup():
    if request.method == "POST":
        parser = reqparse.RequestParser()
        parser.add_argument('name', type=str)
        parser.add_argument('role', type=str)
        parser.add_argument('password', type=str)
        args = parser.parse_args()
        name = args['name']
        role = args['role']
        password = args['password']
        password = password.encode()
        hashed_pass = hashlib.sha512(password).hexdigest()
        utils.addUser(name, role, hashed_pass)
    else:
        return "Hello World"

@app.route('/login', methods=['POST', 'GET'])
def login():    
    if request.method == "POST":
        parser = reqparse.RequestParser()
        parser.add_argument('action', type=str)
        parser.add_argument('name', type=str)
        parser.add_argument('password', type=str)
        parser.add_argument('session_key', type=str)
        args = parser.parse_args()
        action = args['action']
        name = args['name']
        if(action == 'login'):
            password = args['password']
            password = password.encode()
            hashed_pass = hashlib.sha512(password).hexdigest()
            return utils.login(name, hashed_pass)
        else:
            session_key = args['session_key']
            return utils.logout(name, session_key)
    else:
        return "Hello World"

if __name__ == '__main__':
    app.run(debug=True)