from flask import Flask, jsonify, request
from flask_restful import Api
from flask_cors import CORS
import pymongo
import pprint
import utils

app = Flask(__name__)
api = Api(app)

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
        response = str(collection_access.insert_one(sample_data).inserted_id)
        return response
    else:
        return str(collection_access.find_one())

if __name__ == '__main__':
    app.run(debug=True)