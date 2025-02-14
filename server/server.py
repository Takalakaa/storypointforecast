from flask import Flask, request, jsonify
from flask_restful import Api
from flask_cors import CORS
import pymongo
import hashlib
import utils

app = Flask(__name__)
api = Api(app)
CORS(app)

mongo_client = pymongo.MongoClient(utils.connection_string)
db_access = mongo_client["db"]
collection_access = db_access["profiles"]

# Seed initial data into MongoDB if empty
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

@app.route('/signup', methods=['POST'])
def signup():
    data = request.get_json()
    name = data.get('name')
    role = data.get('role')
    password = hashlib.sha512(data.get('password').encode()).hexdigest()
    return utils.addUser(name, role, password)

@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    if data.get('action') == 'login':
        hashed_pass = hashlib.sha512(data.get('password').encode()).hexdigest()
        return utils.login(data.get('name'), hashed_pass)
    else:
        return utils.logout(data.get('name'), data.get('session_key'))

if __name__ == '__main__':
    seed_data()
    app.run(debug=True)
