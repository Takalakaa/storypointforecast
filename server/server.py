from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from bson import ObjectId

app = Flask(__name__)
CORS(app)

# Connect to MongoDB
client = MongoClient("mongodb://localhost:27017/")
db = client["team_profiles"]
users_collection = db["users"]
projects_collection = db["projects"]

# API to get a user profile
@app.route("/users/<user_id>", methods=["GET"])
def get_user(user_id):
    user = users_collection.find_one({"_id": ObjectId(user_id)})
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    user["_id"] = str(user["_id"])
    return jsonify(user)

# API to edit user profile
@app.route("/users/<user_id>", methods=["PUT"])
def update_user(user_id):
    data = request.json
    updated_user = {
        "name": data.get("name"),
        "email": data.get("email"),
        "skills": data.get("skills")
    }
    users_collection.update_one({"_id": ObjectId(user_id)}, {"$set": updated_user})
    return jsonify({"message": "User updated successfully"})

# API for managers to get all developers in a project
@app.route("/projects/<project_id>/developers", methods=["GET"])
def get_project_developers(project_id):
    project = projects_collection.find_one({"_id": ObjectId(project_id)})
    if not project:
        return jsonify({"error": "Project not found"}), 404

    developer_ids = project.get("developers", [])
    developers = list(users_collection.find({"_id": {"$in": [ObjectId(dev_id) for dev_id in developer_ids]}}))
    
    for dev in developers:
        dev["_id"] = str(dev["_id"])
    
    return jsonify(developers)

if __name__ == "__main__":
    app.run(debug=True, port=5000)
