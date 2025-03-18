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
import requests

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


@app.route('/github/analyze/<owner>/<repo>/<username>', methods=['POST'])
def analyze_repository(owner, repo, username):
    try:
        print(f"\n\n===== STARTING ANALYSIS =====")
        print(f"Analyzing repository {owner}/{repo} for user {username}")
        print(
            f"GitHub token length: {len(utils.githubToken) if utils.githubToken else 0}")

        # Instead of using getPullRequests, we'll use the GitHub API directly here
        url = f"https://api.github.com/repos/{owner}/{repo}/pulls?state=all&per_page=100"

        headers = {
            "Authorization": f"token {utils.githubToken}",
            "Accept": "application/vnd.github+json"
        }

        print(f"Fetching PRs for {owner}/{repo} by {username}...")
        response = requests.get(url, headers=headers)

        all_commit_data = []

        if response.status_code == 200:
            all_prs = response.json()
            print(f"Received {len(all_prs)} PRs from API")

            # Filter by author
            filtered_prs = [pr for pr in all_prs if pr.get(
                'user', {}).get('login') == username]
            print(f"Filtered to {len(filtered_prs)} PRs by author {username}")

            pr_numbers = [pr['number'] for pr in filtered_prs]

            print(
                f"Found {len(pr_numbers)} PRs for {username} in {owner}/{repo}: {pr_numbers}")

            # For each PR, get commit data using the existing function
            for pr_number in pr_numbers:
                print(f"Getting commits for PR #{pr_number}...")
                commit_data = utils.getPRCommitAdditions(
                    owner, repo, pr_number, username)
                if commit_data:
                    print(
                        f"Found {len(commit_data)} commits in PR #{pr_number}")
                    all_commit_data.extend(commit_data)
        else:
            print(
                f"Failed to get PRs: {response.status_code} - {response.text}")

        # If no PRs or commits found, try getting direct commits
        if not all_commit_data:
            print(f"No commits found in PRs, trying direct commits...")

            # Get repository info using existing function
            repo_info = utils.getRepoContributorsAndBranches(owner, repo)

            if repo_info:
                print(f"Found repository info for {owner}/{repo}")

                # Find the user's ID
                user_id = None
                contributors = repo_info.get('contributors', []) or []
                for contributor in contributors:
                    if contributor and contributor.get('login', '').lower() == username.lower():
                        user_id = contributor.get('id')
                        print(f"Found user ID for {username}: {user_id}")
                        break

                # Get commits from the branches
                branches = repo_info.get('branches', []) or []
                if user_id and branches:
                    print(f"Found {len(branches)} branches in {owner}/{repo}")
                    for branch in branches:
                        print(f"Getting commits for branch: {branch}")
                        commits = utils.getUserCommitsInBranch(
                            owner, repo, branch, user_id)
                        if commits:
                            print(
                                f"Found {len(commits)} commits in branch {branch}")
                            for commit in commits:
                                if commit:  # Safe check
                                    commit_sha = commit.get('oid')
                                    if commit_sha:
                                        print(
                                            f"Getting additions for commit: {commit_sha}")
                                        additions = utils.getCommitAdditions(
                                            owner, repo, commit_sha)
                                        if additions:
                                            all_commit_data.append({
                                                "sha": commit_sha,
                                                "additions": additions
                                            })
            else:
                print(f"Could not find repository info for {owner}/{repo}")

        # If we found commits, analyze them using the existing analyzePRCommits function
        if all_commit_data:
            print(f"Analyzing {len(all_commit_data)} commits")

            # Use your existing analyzePRCommits function
            skill_analysis = utils.analyzePRCommits(all_commit_data)

            print(f"Analysis results: {skill_analysis}")

            # Get the user's actual name from their git username
            mongo_client = pymongo.MongoClient(utils.connection_string)
            db = mongo_client["users"]
            user_data = db.authentication.find_one({"git_name": username})

            if user_data and user_data.get("name"):
                print(f"Updating skills for user: {user_data.get('name')}")
                # Update skills using existing function
                utils.adjustSkills(user_data.get("name"), skill_analysis)
            else:
                print(f"Could not find user with git_name: {username}")

            return jsonify({
                "success": True,
                "user": username,
                "repository": f"{owner}/{repo}",
                "analysis": skill_analysis,
                "commits_analyzed": len(all_commit_data)
            })
        else:
            print("No commits found for analysis")
            return jsonify({
                "success": False,
                "error": "No commits found for analysis"
            })

    except Exception as e:
        import traceback
        print(f"ERROR in analyze_repository: {str(e)}")
        print(traceback.format_exc())
        return jsonify({
            "success": False,
            "error": str(e)
        })


if __name__ == '__main__':
    init_developer_skills()
    seed_data()
    github_token, gpt_token = utils.setupAPITokens()
    print(f"GitHub token length: {len(github_token) if github_token else 0}")
    app.run(debug=True)
