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


@app.route('/github/analyze/<repo>/<username>', methods=['POST'])
def analyze_repository(repo, username):
    try:
        # For this simplified version, we'll assume the username is also the owner
        owner = username

        # Get all PRs for the repo
        command = f"gh pr list --repo {owner}/{repo} --state all --json number --author {username}"
        pr_response = run_gh_command(command)

        all_commit_data = []

        if pr_response.json.get('success'):
            pr_data = pr_response.json.get('data', [])
            pr_numbers = [pr['number'] for pr in pr_data]

            # For each PR, get commit data
            for pr_number in pr_numbers:
                commit_data = utils.getPRCommitAdditions(
                    owner, repo, pr_number, username)
                if commit_data:
                    all_commit_data.extend(commit_data)

        # If no PRs or commits found, try getting direct commits
        if not all_commit_data:
            # Get repository contributors and branches
            repo_info = utils.getRepoContributorsAndBranches(owner, repo)

            if repo_info:
                # Find the user's ID
                user_id = None
                for contributor in repo_info.get('contributors', []):
                    if contributor.get('login') == username:
                        user_id = contributor.get('id')
                        break

                # Get commits from the branches
                if user_id and repo_info.get('branches'):
                    for branch in repo_info.get('branches'):
                        commits = utils.getUserCommitsInBranch(
                            owner, repo, branch, user_id)
                        if commits:
                            for commit in commits:
                                commit_sha = commit.get('oid')
                                additions = utils.getCommitAdditions(
                                    owner, repo, commit_sha)
                                if additions:
                                    all_commit_data.append({
                                        "sha": commit_sha,
                                        "additions": additions
                                    })

        # Analyze the commit data
        if all_commit_data:
            skill_analysis = utils.analyzePRCommits(all_commit_data)

            # Get the user's actual name from their git username
            mongo_client = pymongo.MongoClient(utils.connection_string)
            db = mongo_client["users"]
            user_data = db.authentication.find_one({"git_name": username})

            if user_data and user_data.get("name"):
                # Update skills
                utils.adjustSkills(user_data.get("name"), skill_analysis)

            return jsonify({
                "success": True,
                "user": username,
                "repository": repo,
                "analysis": skill_analysis,
                "commits_analyzed": len(all_commit_data)
            })
        else:
            return jsonify({
                "success": False,
                "error": "No commits found for analysis"
            })

    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        })


@app.route('/github/test-token', methods=['GET'])
def test_github_token():
    """Simple endpoint to test if GitHub token is valid"""
    try:
        import requests
        # Try the REST API first (uses 'token' prefix)
        headers_rest = {
            'Authorization': f'token {utils.githubToken}',
            'Accept': 'application/vnd.github+json'
        }

        # Get authenticated user info - simple API call
        response = requests.get(
            'https://api.github.com/user', headers=headers_rest)

        if response.status_code == 200:
            user_data = response.json()
            return jsonify({
                "success": True,
                "message": "Token is valid for REST API",
                "user": user_data.get('login'),
                "token_type": "REST API (token prefix)"
            })

        # If that fails, try GraphQL API with 'bearer' prefix
        headers_graphql = {
            'Authorization': f'Bearer {utils.githubToken}',
            'Content-Type': 'application/json'
        }

        query = """
        query { 
            viewer { 
                login
            }
        }
        """

        response = requests.post(
            'https://api.github.com/graphql',
            headers=headers_graphql,
            json={'query': query}
        )

        if response.status_code == 200:
            data = response.json()
            if 'errors' not in data:
                return jsonify({
                    "success": True,
                    "message": "Token is valid for GraphQL API",
                    "user": data.get('data', {}).get('viewer', {}).get('login'),
                    "token_type": "GraphQL API (bearer prefix)"
                })

        # Both methods failed - show detailed error info
        return jsonify({
            "success": False,
            "rest_status": response.status_code,
            "rest_response": response.text,
            "message": "GitHub token validation failed for both REST and GraphQL APIs",
            "token_length": len(utils.githubToken) if utils.githubToken else 0,
            "token_starts_with": utils.githubToken[:4] + "..." if utils.githubToken and len(utils.githubToken) > 4 else None
        })

    except Exception as e:
        import traceback
        return jsonify({
            "success": False,
            "error": str(e),
            "traceback": traceback.format_exc()
        })


@app.route('/github/cli-test', methods=['GET'])
def test_github_cli():
    """Test if GitHub CLI is properly authenticated"""
    try:
        import subprocess

        # Check if gh is installed and authenticated
        result = subprocess.run(
            "gh auth status",
            capture_output=True,
            text=True,
            shell=True
        )

        if result.returncode == 0:
            return jsonify({
                "success": True,
                "message": "GitHub CLI is authenticated",
                "details": result.stdout
            })
        else:
            return jsonify({
                "success": False,
                "message": "GitHub CLI authentication issue",
                "error": result.stderr,
                "exit_code": result.returncode
            })

    except Exception as e:
        import traceback
        return jsonify({
            "success": False,
            "error": str(e),
            "traceback": traceback.format_exc()
        })


if __name__ == '__main__':
    init_developer_skills()
    seed_data()
    utils.setupAPITokens()
    app.run(debug=True)
