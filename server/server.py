from flask import Flask, jsonify, request
from flask_restful import Api
from flask_cors import CORS
import pymongo
import hashlib
import subprocess
import utils
import json
from developer_db_setup import init_developer_skills

app = Flask(__name__)
api = Api(app)
CORS(app)

# Utility function to run GitHub CLI commands
def run_gh_command(command):
    try:
        result = subprocess.run(command, capture_output=True, text=True, shell=True)
        if result.returncode == 0:
            return jsonify({"success": True, "data": json.loads(result.stdout.strip())})
        else:
            return jsonify({"success": False, "error": result.stderr.strip()})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)})


# GitHub Repository Information
@app.route('/github/repo/<owner>/<repo>', methods=['GET'])
def get_repo_info(owner, repo):
    command = f"gh repo view {owner}/{repo} --json name,description,url,owner"
    return run_gh_command(command)


# List Projects in a Repository
@app.route('/github/projects/repo/<owner>/<repo>', methods=['GET'])
def get_repo_projects(owner, repo):
    command = f"gh project list --repo {owner}/{repo} --json number,title,url"
    return run_gh_command(command)


# List Projects in an Organization
@app.route('/github/projects/org/<org>', methods=['GET'])
def get_org_projects(org):
    command = f"gh project list --org {org} --json number,title,url"
    return run_gh_command(command)


# Get Details of a Specific Project
@app.route('/github/project/<owner>/<repo>/<int:project_number>', methods=['GET'])
def get_project_details(owner, repo, project_number):
    command = f"gh project view {project_number} --repo {owner}/{repo} --json title,url"
    return run_gh_command(command)


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



if __name__ == '__main__':
    init_developer_skills()
    app.run(debug=True)
