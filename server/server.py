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
        data = request.get_json()
        name = data.get('name')
        role = data.get('role')
        password = data.get('password')
        password = password.encode()
        hashed_pass = hashlib.sha512(password).hexdigest()
        return utils.addUser(name, role, hashed_pass)
    else:
        return "Hello World"

@app.route('/login', methods=['POST', 'GET'])
def login():    
    if request.method == "POST":
        data = request.get_json()
        action = data.get('action')
        name = data.get('name')
        if(action == 'login'):
            password = data.get('password')
            password = password.encode()
            hashed_pass = hashlib.sha512(password).hexdigest()
            return utils.login(name, hashed_pass)
        else:
            session_key = data.get('session_key')
            return utils.logout(name, session_key)
    else:
        return "Hello World"

if __name__ == '__main__':
    app.run(debug=True)