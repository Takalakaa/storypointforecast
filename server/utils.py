from flask import Flask, Response, jsonify
from flask_restful import Resource, Api
import secrets
import datetime
import logging
import openai
import requests
import json
import pymongo


HEADSTRING = "mongodb://"
base_url = "localhost:"
port = "27017"

githubToken = ""
GPTAPIToken = ""

connection_string = HEADSTRING + base_url + port

logger = logging.getLogger()


def make_connection(db):
    mongo_client = pymongo.MongoClient(connection_string)
    db_access = mongo_client[db]
    return (db_access)


def login(user, hashedPass):
    db = make_connection("users")
    result = db.authentication.find_one({"name": user, "password": hashedPass})
    if result is None:
        return "0"
    name = result.get("name")
    role = result.get("role")
    session_key = secrets.token_urlsafe(32)
    db.authentication.update_one(
        {"name": user},
        {"$set": {"session_token": session_key}}
    )
    return [name, role, session_key]


def getUser(username):
    db = make_connection("users")
    result = db.authentication.find_one({"name": username})
    if result is None:
        return Response("{'error':'User does not exist'}", status=201, mimetype='application/json')
    else:
        result.pop("_id")
        result.pop("session_token")
        result.pop("password")
        return jsonify(result)


def updateUser(name, role, git_name, active_user):
    db = make_connection("users")
    result = db.authentication.find_one({"name": active_user})
    print(name)
    if (result != None):
        filter = {'name': active_user}
        newValues = {"$set": {'name': name,
                              'role': role, 'git_name': git_name}}
        output = db.authentication.update_one(filter, newValues)
        return Response([str(output.upserted_id), str(output.acknowledged)], status=200, mimetype='application/json')
    else:
        return Response("{'error':'User does not exist'}", status=201, mimetype='application/json')


def logout(user, session_key):
    db = make_connection("users")
    result = db.authentication.find(
        {"name": user, "session_token": session_key})
    if (result == []):
        return False
    db.authentication.find_one_and_replace(
        {"name": user, "session_token": session_key}, {"session_token": None})
    return True


def addUser(name, role, password, git_name):
    db = make_connection("users")
    result = db.authentication.find_one({"name": name, "role": role})
    if (result == None):
        output = db.authentication.insert_one(
            {"name": name, "password": password, "role": role, "git_name": git_name})
        return Response([str(output.inserted_id), str(output.acknowledged)], status=200, mimetype='application/json')
    else:
        return Response("{'error':'User already exists'}", status=201, mimetype='application/json')


def setupAPITokens():
    global githubToken, GPTAPIToken
    githubToken = input("Please enter your GitHub API token: ")
    GPTAPIToken = input("Please enter your GPT API token: ")
    return githubToken, GPTAPIToken


def queryGPT(user_query, dev_query=""):
    client = openai.OpenAI(api_key=GPTAPIToken)
    completion = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "developer", "content": dev_query},
            {
                "role": "user",
                "content": user_query
            }
        ]
    )
    return completion.choices[0].message.content


def getDevSkills(name):
    mongo_client = pymongo.MongoClient(connection_string)
    db = mongo_client["db"]
    developer = db.developerSkills.find_one({"name": name})
    if developer:
        # Remove the _id and name fields
        developer.pop('_id', None)
        developer.pop('name', None)
        return jsonify(developer)
    return jsonify({"error": "Developer not found"}), 404


def adjustSkills(name, skillsDict):

    mongo_client = pymongo.MongoClient(connection_string)
    db = mongo_client["db"]

    current_skills_doc = db.developerSkills.find_one({"name": name})

    sanitized_skills = {}
    for key, value in skillsDict.items():
        # Replace dots and other problematic characters
        sanitized_key = key.lower().replace('.', '_').replace('$', '_').replace('#', '_')
        sanitized_skills[sanitized_key] = value

    if not current_skills_doc:
        # If user doesn't exist, create entry with all new skills
        initial_data = {"name": name}
        db.developerSkills.insert_one(initial_data)

        # Insert all skills directly
        for key, value in sanitized_skills.items():
            db.developerSkills.update_one(
                {"name": name},
                {"$set": {key: value}}
            )
    else:
        # User exists, update each skill with weighted average if it exists
        filter = {'name': name}
        for key, new_value in sanitized_skills.items():
            # Check if skill already exists
            if key in current_skills_doc:
                current_value = current_skills_doc.get(key, 0)
                # Apply weighted average: 80% old value, 20% new value
                updated_value = 0.8 * current_value + 0.2 * new_value

                db.developerSkills.update_one(
                    filter,
                    {"$set": {key: updated_value}}
                )
            else:
                # New skill, add it directly
                db.developerSkills.update_one(
                    filter,
                    {"$set": {key: new_value}}
                )

    mongo_client.close()
    print(f"Successfully updated skills for {name}")


def getAllRepos(username):
    try:
        # API endpoint for user's contributed repositories
        url = f"https://api.github.com/users/{username}/repos"

        # Get all repositories including those contributed to
        response = requests.get(url, params={"type": "all", "per_page": 100})

        if response.status_code != 200:
            return jsonify({
                "success": False,
                "error": f"GitHub API error: {response.status_code}"
            })

        repos = response.json()

        # Extract relevant repository information
        repo_data = []
        for repo in repos:
            repo_info = {
                "name": repo["name"],
                "full_name": repo["full_name"],
                "owner": repo["owner"]["login"],
                "description": repo["description"],
                "url": repo["html_url"],
                "stars": repo["stargazers_count"],
                "forks": repo["forks_count"],
                "language": repo["language"]
            }
            repo_data.append(repo_info)

        return jsonify({
            "success": True,
            "data": repo_data,
            "total_count": len(repo_data)
        })

    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        })


def getRepoContributorsAndBranches(owner, repo):
    query = """
    query GetRepoContributorsAndBranches($owner: String!, $repo: String!) {
      repository(owner: $owner, name: $repo) {
        collaborators(first: 100, affiliation: ALL) {
          edges {
            node {
              login
              name
              id
            }
          }
        }
        refs(refPrefix: "refs/heads/", first: 100) {
          edges {
            node {
              name
            }
          }
        }
      }
    }
    """
    variables = {
        "owner": owner,
        "repo": repo,
    }

    headers = {
        'Authorization': f'Bearer {githubToken}',
        'Content-Type': 'application/json'
    }

    response = requests.post('https://api.github.com/graphql',
                             headers=headers, json={'query': query, 'variables': variables})

    if response.status_code == 200:
        data = response.json()
        contributors = data.get('data', {}).get('repository', {}).get(
            'collaborators', {}).get('edges', [])
        branches = data.get('data', {}).get(
            'repository', {}).get('refs', {}).get('edges', [])

        contributor_list = [edge['node'] for edge in contributors]
        branch_list = [edge['node']['name'] for edge in branches]

        result = {
            "contributors": contributor_list,
            "branches": branch_list
        }
        print(json.dumps(result, indent=2))
        return result
    else:
        print(f"Request failed with status code {response.status_code}")
        return None


def getUserCommitsInBranch(owner, repo, branch, user_id):
    query = """
    query GetUserCommitsInBranch(
      $owner: String!
      $repo: String!
      $branch: String!
      $userId: ID!
    ) {
      repository(owner: $owner, name: $repo) {
        ref(qualifiedName: $branch) {
          target {
            ... on Commit {
              history(author: { id: $userId }, first: 100) {
                edges {
                  node {
                    oid
                    messageHeadline
                    committedDate
                  }
                }
              }
            }
          }
        }
      }
    }
    """

    variables = {
        "owner": owner,
        "repo": repo,
        "branch": branch,
        "userId": user_id,
    }

    headers = {
        'Authorization': f'Bearer {githubToken}',
        'Content-Type': 'application/json'
    }

    response = requests.post('https://api.github.com/graphql',
                             headers=headers, json={'query': query, 'variables': variables})

    if response.status_code == 200:
        data = response.json()
        commits = data.get('data', {}).get('repository', {}).get(
            'ref', {}).get('target', {}).get('history', {}).get('edges', [])
        commit_list = [edge['node'] for edge in commits]
        print(json.dumps(commit_list, indent=2))
        return commit_list
    else:
        print(f"Request failed with status code {response.status_code}")
        return None


def getCommitAdditions(owner, repo, commit_sha):
    url = f"https://api.github.com/repos/{owner}/{repo}/commits/{commit_sha}"
    headers = {
        "Authorization": f"token {githubToken}",
        "Accept": "application/vnd.github+json",
    }

    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        commit_data = response.json()
        files = commit_data.get("files", [])

        file_additions = {}
        for file in files:
            patch = file.get("patch")
            if patch:
                lines = patch.splitlines()
                added_lines = [line[1:] for line in lines if line.startswith(
                    "+") and not line.startswith("+++")]
                file_additions[file["filename"]] = added_lines

        return file_additions

    except requests.exceptions.RequestException as e:
        print(f"Error fetching commit data: {e}")
        return None
    except KeyError as e:
        print(f"Error parsing commit data: Missing key {e}")
        return None
    except ValueError as e:
        print(f"Error decoding JSON response: {e}")
        return None


def getPRCommitAdditions(owner, repo, pr_number, author_username=None):
    url = f"https://api.github.com/repos/{owner}/{repo}/pulls/{pr_number}/commits"
    headers = {
        "Authorization": f"token {githubToken}",
        "Accept": "application/vnd.github+json",
    }

    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        commits = response.json()
        filtered_commits = []

        for commit in commits:
            author = commit.get("author")
            if author_username is None or (author and author["login"] == author_username):
                filtered_commits.append(commit)

        all_commit_additions = []
        for commit in filtered_commits:
            commit_sha = commit["sha"]
            commit_url = f"https://api.github.com/repos/{owner}/{repo}/commits/{commit_sha}"
            commit_response = requests.get(commit_url, headers=headers)
            commit_response.raise_for_status()
            commit_data = commit_response.json()
            files = commit_data.get("files", [])

            file_additions = {}
            for file in files:
                patch = file.get("patch")
                if patch:
                    lines = patch.splitlines()
                    added_lines = [line[1:] for line in lines if line.startswith(
                        "+") and not line.startswith("+++")]
                    file_additions[file["filename"]] = added_lines
            all_commit_additions.append({
                "sha": commit_sha,
                "additions": file_additions
            })

        return all_commit_additions

    except requests.exceptions.RequestException as e:
        print(f"Error fetching PR commit data: {e}")
        return None
    except KeyError as e:
        print(f"Error parsing PR commit data: Missing key {e}")
        return None
    except ValueError as e:
        print(f"Error decoding JSON response: {e}")
        return None


def getPRAuthors(owner, repo, pr_number):
    url = f"https://api.github.com/repos/{owner}/{repo}/pulls/{pr_number}/commits"
    headers = {
        "Authorization": f"token {githubToken}",
        "Accept": "application/vnd.github+json",
    }

    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        commits = response.json()

        authors = set()
        for commit in commits:
            author = commit.get("author")
            if author:
                authors.add(author["login"])

        return sorted(list(authors))

    except requests.exceptions.RequestException as e:
        print(f"Error fetching PR commit data: {e}")
        return None
    except KeyError as e:
        print(f"Error parsing PR commit data: Missing key {e}")
        return None
    except ValueError as e:
        print(f"Error decoding JSON response: {e}")
        return None


def analyzePRCommits(commitData):
    category_skill_map = {}
    dev_query = (
        "Analyze the following list of code additions from a GitHub commit. "
        "Categorize them based on specific technologies, programming languages, or fields "
        "(e.g., Python, React, DevOps, Security, Database, Testing). "
        "For each category, also assess the skill level demonstrated on a scale of 1-5, "
        "where 1 is beginner and 5 is expert. "
        "Return the results in CSV format as 'category, skill_level' with no extra text or formatting."
    )

    for commit in commitData:
        additions_text = ""
        for file, lines in commit["additions"].items():
            additions_text += f"File: {file}\n"
            for line in lines:
                additions_text += f"+ {line}\n"

        if additions_text:
            gpt_response = queryGPT(additions_text, dev_query)
            if gpt_response:
                for row in gpt_response.split("\n"):
                    parts = row.split(",")
                    if len(parts) == 2:
                        category = parts[0].strip()
                        try:
                            skill_level = int(parts[1].strip())
                            category_skill_map[category] = skill_level
                        except ValueError:
                            continue

    return category_skill_map


def getGitHubProjectIssues(owner, repo, project_number=None):
    """
    Get open issues from a GitHub project board (v2) associated with a repository.
    Extract estimates and skills from title hashtags.

    Parameters:
    - owner: GitHub username or organization that owns the repository
    - repo: Name of the repository
    - project_number: Project number (if None, will try to find the first project)

    Returns:
    - Dictionary containing project columns and their issues
    """
    global githubToken

    print(f"Fetching GitHub project issues for {owner}/{repo}")
    print(f"Using token of length: {len(githubToken) if githubToken else 0}")

    try:
        # First try to find projects using GraphQL (which supports both classic and v2 projects)
        query = """
        query getProjects($owner: String!, $name: String!) {
          repository(owner: $owner, name: $name) {
            projectsV2(first: 10) {
              nodes {
                id
                number
                title
              }
            }
          }
        }
        """

        variables = {
            "owner": owner,
            "name": repo
        }

        headers = {
            "Authorization": f"Bearer {githubToken}",
            "Content-Type": "application/json"
        }

        print(f"Making GraphQL request to find projects")
        response = requests.post('https://api.github.com/graphql',
                                 headers=headers,
                                 json={'query': query, 'variables': variables})

        if response.status_code != 200:
            print(
                f"GraphQL request failed with status code {response.status_code}: {response.text}")
            return {"success": False, "error": f"GitHub API error: {response.status_code} - {response.text}"}

        data = response.json()
        projects = data.get('data', {}).get('repository', {}).get(
            'projectsV2', {}).get('nodes', [])

        if not projects:
            print(f"No projects found for {owner}/{repo}")
            return {"success": False, "error": "No projects found for this repository"}

        # Select the project (either by number or the first one)
        target_project = None
        if project_number:
            for project in projects:
                if project.get('number') == project_number:
                    target_project = project
                    break
            if not target_project:
                print(f"Project #{project_number} not found")
                return {"success": False, "error": f"Project #{project_number} not found"}
        else:
            target_project = projects[0]
            project_number = target_project.get('number')

        project_id = target_project.get('id')
        project_title = target_project.get('title')

        print(f"Found project: {project_title} (#{project_number})")

        # Now get items and their status fields
        query = """
        query getProjectItems($projectId: ID!) {
          node(id: $projectId) {
            ... on ProjectV2 {
              items(first: 100) {
                nodes {
                  id
                  fieldValues(first: 20) {
                    nodes {
                      ... on ProjectV2ItemFieldSingleSelectValue {
                        name
                        field {
                          ... on ProjectV2SingleSelectField {
                            name
                          }
                        }
                      }
                      ... on ProjectV2ItemFieldTextValue {
                        text
                        field {
                          ... on ProjectV2Field {
                            name
                          }
                        }
                      }
                    }
                  }
                  content {
                    ... on Issue {
                      number
                      title
                      state
                      url
                      body
                      createdAt
                      updatedAt
                      assignees(first: 5) {
                        nodes {
                          login
                        }
                      }
                      labels(first: 5) {
                        nodes {
                          name
                        }
                      }
                    }
                  }
                }
              }
              fields(first: 20) {
                nodes {
                  ... on ProjectV2SingleSelectField {
                    id
                    name
                    options {
                      id
                      name
                    }
                  }
                }
              }
            }
          }
        }
        """

        variables = {
            "projectId": project_id
        }

        print(f"Making GraphQL request to get project items")
        response = requests.post('https://api.github.com/graphql',
                                 headers=headers,
                                 json={'query': query, 'variables': variables})

        if response.status_code != 200:
            print(
                f"Failed to get project items: {response.status_code} - {response.text}")
            return {"success": False, "error": f"GitHub API error: {response.status_code} - {response.text}"}

        data = response.json()

        project_data = data.get('data', {}).get('node', {})
        items_data = project_data.get('items', {}).get('nodes', [])
        fields_data = project_data.get('fields', {}).get('nodes', [])

        # Find the status field
        status_field = None
        for field in fields_data:
            if field.get('name') == 'Status':
                status_field = field
                break

        # Process items and organize by status
        columns = {}

        # Import re for regex pattern matching
        import re

        for item in items_data:
            content = item.get('content', {})

            # Skip if not an issue or if issue is closed
            if not content or content.get('state') != 'OPEN':
                continue

            # Find status field value
            status_value = None
            for field_value in item.get('fieldValues', {}).get('nodes', []):
                field = field_value.get('field', {})
                if field and field.get('name') == 'Status':
                    status_value = field_value.get('name')
                    break

            # If no status found, use default
            if not status_value:
                status_value = "No Status"

            # Get the title and extract estimate and skills
            original_title = content.get('title', '')
            clean_title = original_title
            estimate = None
            skills = []

            # Extract all hashtags from the title
            hashtags = re.findall(r'#(\w+)', original_title)

            # Process each hashtag
            for tag in hashtags:
                # If the tag is a number, it's an estimate
                if tag.isdigit():
                    estimate = int(tag)
                    # Remove the estimate hashtag from the title
                    clean_title = re.sub(r'#' + tag + r'\b', '', clean_title)
                # Otherwise, it's a skill
                else:
                    skills.append(tag)
                    # Remove the skill hashtag from the title
                    clean_title = re.sub(r'#' + tag + r'\b', '', clean_title)

            # Clean up extra spaces
            clean_title = re.sub(r'\s+', ' ', clean_title).strip()

            # For debugging
            print(f"Original title: {original_title}")
            print(f"Clean title: {clean_title}")
            print(f"Estimate: {estimate}")
            print(f"Skills: {skills}")

            # Create structure for issue
            issue_info = {
                "number": content.get('number'),
                "title": clean_title,
                "original_title": original_title,
                "url": content.get('url'),
                "body": content.get('body'),
                "created_at": content.get('createdAt'),
                "updated_at": content.get('updatedAt'),
                "estimate": estimate,
                "skills": skills,
                "assignees": [assignee.get('login') for assignee in content.get('assignees', {}).get('nodes', [])],
                "labels": [label.get('name') for label in content.get('labels', {}).get('nodes', [])]
            }

            # Add to appropriate column
            if status_value not in columns:
                columns[status_value] = []

            columns[status_value].append(issue_info)

        print(
            f"Found {sum(len(issues) for issues in columns.values())} issues across {len(columns)} status columns")

        return {
            "success": True,
            "project_name": project_title,
            "project_number": project_number,
            "project_id": project_id,
            "columns": columns
        }

    except Exception as e:
        import traceback
        print(f"Error getting GitHub project issues: {str(e)}")
        traceback.print_exc()
        return {"success": False, "error": str(e)}
