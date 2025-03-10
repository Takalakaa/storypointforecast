from flask import Flask, jsonify, request
from flask_restful import Api
from flask_cors import CORS
import pymongo
import hashlib
import subprocess
import utils
import json
from developer_db_setup import init_developer_skills
from flask import Flask, jsonify

app = Flask(__name__)
api = Api(app)
CORS(app)


mongo_client = pymongo.MongoClient(utils.connection_string)
db_access = mongo_client["db"]
collection_access = db_access["profiles"]
collection_access = db_access["collection"]

# Utility function to run GitHub CLI commands


def run_gh_command(command):
    try:
        result = subprocess.run(
            command, capture_output=True, text=True, shell=True)
        if result.returncode == 0:
            return jsonify({"success": True, "data": json.loads(result.stdout.strip())})
        else:
            return jsonify({"success": False, "error": result.stderr.strip()})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)})


@app.route('/github/contributions/<username>')
def get_user_contributions(username):
    return utils.getAllRepos(username)
    


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


@app.route('/signup', methods=['POST', 'GET'])
def signup():
    mongo_client = pymongo.MongoClient(utils.connection_string)
    db = mongo_client["db"]
    if request.method == "POST":
        data = request.get_json()
        name = data.get('name')
        git_user = data.get('git_uname')
        role = data.get('role')
        password = data.get('password')
        password = password.encode()
        hashed_pass = hashlib.sha512(password).hexdigest()
        db.developerSkills.insert_one({"name": name})
        return utils.addUser(name, role, hashed_pass, git_user)

    else:
        return "Hello World"


@app.route('/login', methods=['POST'])
def login():
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
    return utils.getUser(username)


@app.route('/gitUserName/<username>', methods=['GET'])
def get_gitUser(username):
    mongo_client = pymongo.MongoClient(utils.connection_string)
    db = mongo_client["users"]
    user_data = db.authentication.find_one({"name": username})

    if user_data:
        return user_data["git_name"]
    else:
        return ""


@app.route('/profile/<username>', methods=['POST'])
def update_profile(username):
    data = request.get_json()
    name = data.get('name')
    git_user = data.get('git_name')
    role = data.get('role')
    return utils.updateUser(name, role, git_user, username)


@app.route('/developer/<name>', methods=['GET'])
def get_developer_skills(name):
    return utils.getDevSkills(name)

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


# get all pull request Code Changes curl http://127.0.0.1:5000/github/prs/Takalakaa/storypointforecast
@app.route('/github/prs/<owner>/<repo>', methods=['GET'])
def get_all_prs(owner, repo):
    command = f"gh pr list --repo {owner}/{repo} --state all --json number,title,state,url"
    return run_gh_command(command)


# estimate story points curl http://127.0.0.1:5000/github/project/Takalakaa/3/estimates
@app.route('/github/project/<owner>/<int:project_number>/estimates', methods=['GET'])
def get_project_estimates(owner, project_number):
    command = f"gh project item-list {project_number} --owner {owner} --format json"
    return run_gh_command(command)


@app.route('/developer/<name>/skills', methods=['POST'])
def update_skills(name):
    try:
        mongo_client = pymongo.MongoClient(utils.connection_string)
        db = mongo_client["db"]

        data = request.json

        if not isinstance(data, dict) or not data:
            return jsonify({"error": "Invalid data format. Expected a dictionary of skills and values."}), 400

        for skill, value in data.items():
            if not isinstance(value, int) or value < 0 or value > 5:
                return jsonify({"error": f"Skill value for {skill} must be an integer between 0 and 5."}), 400

        update_data = {skill.lower(): value for skill, value in data.items()}

        developer = db.developerSkills.find_one({"name": name})

        if developer:
            db.developerSkills.update_one(
                {"name": name},
                {"$set": update_data}
            )
            message = "Skills updated successfully"
        else:
            db.developerSkills.insert_one({"name": name})
            db.developerSkills.update_one(
                {"name": name},
                {"$set": update_data}
            )
            message = "Developer created and skills added successfully"

        mongo_client.close()

        return jsonify({
            "message": message,
            "updated_skills": update_data if developer else {**update_data, "name": name}
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    utils.setupAPITokens()
    init_developer_skills()
    seed_data()
    app.run(debug=True)
    
