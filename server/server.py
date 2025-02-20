from flask import Flask, jsonify, request
from flask_restful import Api, reqparse
from flask_cors import CORS
import pymongo
import pprint
from developer_db_setup import init_developer_skills
import json
import hashlib
import utils

app = Flask(__name__)
api = Api(app)
CORS(app)

mongo_client = pymongo.MongoClient(utils.connection_string)
db_access = mongo_client["db"]
collection_access = db_access["profiles"]
collection_access = db_access["collection"]

@app.route('/sample_connection', methods=['POST', 'GET'])
def sample_connection():
    # mongo_client = pymongo.MongoClient(utils.connection_string)
    # db_access = mongo_client["db"]
    # collection_access = db_access["collection"]
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
        if (action == 'login'):
            password = data.get('password')
            password = password.encode()
            hashed_pass = hashlib.sha512(password).hexdigest()
            return utils.login(name, hashed_pass)
        else:
            session_key = data.get('session_key')
            return utils.logout(name, session_key)
    else:
        return "Hello World"
    
def seed_data():
    if collection_access.count_documents({}) == 0:
        initial_users = [
            {
                "username": "johndoe123",
                "name": "John Doe",
                "password": hashlib.sha512("password123".encode()).hexdigest(),
                "role": "Developer",
                "skills": [
                    {"skill": "Java", "rank": 4},
                    {"skill": "Python", "rank": 3},
                    {"skill": "React", "rank": 5}
                ]
            },
            {
                "username": "admin01",
                "name": "Admin User",
                "password": hashlib.sha512("adminpass".encode()).hexdigest(),
                "role": "Admin",
                "skills": [
                    {"skill": "Project Management", "rank": 5},
                    {"skill": "Python", "rank": 2}
                ]
            },
            {
                "username": "pmuser",
                "name": "Project Manager",
                "password": hashlib.sha512("pmpass".encode()).hexdigest(),
                "role": "Project Manager",
                "skills": [
                    {"skill": "Agile", "rank": 4},
                    {"skill": "Communication", "rank": 5}
                ]
            }
        ]
        collection_access.insert_many(initial_users)

@app.route('/profile/<username>', methods=['GET'])
def get_profile(username):
    user = collection_access.find_one({"username": username}, {"_id": 0})
    if user:
        return jsonify(user), 200
    return jsonify({"error": "User not found"}), 404

@app.route('/profile/<username>', methods=['PUT'])
def update_profile(username):
    data = request.get_json()
    if 'password' in data:
        data['password'] = hashlib.sha512(data['password'].encode()).hexdigest()
    result = collection_access.update_one({"username": username}, {"$set": data}, upsert=True)
    if result.matched_count:
        return jsonify({"message": "Profile updated successfully"}), 200
    return jsonify({"message": "Profile created successfully"}), 201


@app.route('/developer/<name>', methods=['GET'])
def get_developer_skills(name):
    mongo_client = pymongo.MongoClient(utils.connection_string)
    db = mongo_client["db"]
    developer = db.developerSkills.find_one({"name": name})
    if developer:
        # Remove the _id and name fields
        developer.pop('_id', None)
        developer.pop('name', None)
        return jsonify(developer)
    return jsonify({"error": "Developer not found"}), 404

# Get specific skill value for a developer


@app.route('/developer/<name>/skill/<skill>', methods=['GET'])
def get_specific_skill(name, skill):
    mongo_client = pymongo.MongoClient(utils.connection_string)
    db = mongo_client["db"]
    developer = db.developerSkills.find_one({"name": name})
    if developer:
        # Return 0 if skill doesn't exist
        skill_value = developer.get(skill, 0)
        return jsonify({skill: skill_value})
    return jsonify({"error": "Developer not found"}), 404


@app.route('/developer/<name>/skill/<skill>', methods=['PUT'])
def update_skill(name, skill):
    try:
        mongo_client = pymongo.MongoClient(utils.connection_string)
        db = mongo_client["db"]

        data = request.json
        if 'value' not in data:
            return jsonify({"error": "Skill value is required"}), 400

        skill_value = data['value']

        if not isinstance(skill_value, int) or skill_value < 0 or skill_value > 5:
            return jsonify({"error": "Skill value must be an integer between 0 and 5"}), 400

        skill = skill.lower()

        result = db.developerSkills.update_one(
            {"name": name},
            {"$set": {skill: skill_value}}
        )

        # Close the connection
        mongo_client.close()

        if result.matched_count == 0:
            return jsonify({"error": "Developer not found"}), 404

        return jsonify({
            "message": "Skill updated successfully",
            "skill": skill,
            "value": skill_value
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    init_developer_skills()
    seed_data()
    app.run(debug=True)
