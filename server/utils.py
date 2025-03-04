from flask import Flask, Response
from flask_restful import Resource, Api
import secrets
# import pymongo
import datetime
import logging
import openai
import requests
import json

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
    return(db_access)

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


def logout(user, session_key):
    db = make_connection("users")
    result = db.authentication.find({"name": user, "session_token": session_key})
    if(result == []):
        return False
    db.authentication.find_one_and_replace({"name": user, "session_token": session_key},{"session_token": None})
    return True

def addUser(name, role, password):
    db = make_connection("users")
    result = db.authentication.find_one({"name": name, "role": role})
    if(result == None):
        output = db.authentication.insert_one({"name": name, "password": password, "role": role})
        return Response([str(output.inserted_id), str(output.acknowledged)], status=200, mimetype='application/json')
    else:
        return Response("{'error':'User already exists'}", status=201, mimetype='application/json')

def setupAPITokens():
    githubToken = input("Please enter your GitHub API token")
    # GPTAPIToken = input("Please enter your GPT API token")

def queryGPT(user_query,dev_query=""):
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

def getAllRepos(username):
    query = """
    query GetUserRepos($username: String!) {
      user(login: $username) {
        repositories(privacy: PUBLIC, affiliations: [OWNER, COLLABORATOR, ORGANIZATION_MEMBER]) {
          nodes {
            nameWithOwner
          }
        }
      }
    }
    """

    variables = {
        "username": username
    }

    headers = {
        'Authorization': f'Bearer {githubToken}',
        'Content-Type': 'application/json'
    }

    response = requests.post('https://api.github.com/graphql', headers=headers, json={'query': query, 'variables': variables})

    if response.status_code == 200:
        data = response.json()
        repositories = data.get('data', {}).get('user', {}).get('repositories', {}).get('nodes', [])

        if repositories:
            repo_list = [repo.get('nameWithOwner') for repo in repositories if repo.get('nameWithOwner')]
            print(json.dumps(repo_list, indent=2))
        else:
            print("No repositories found.")
    else:
        print(f"Request failed with status code {response.status_code}")

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

    response = requests.post('https://api.github.com/graphql', headers=headers, json={'query': query, 'variables': variables})

    if response.status_code == 200:
        data = response.json()
        contributors = data.get('data', {}).get('repository', {}).get('collaborators', {}).get('edges', [])
        branches = data.get('data', {}).get('repository', {}).get('refs', {}).get('edges', [])

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

    response = requests.post('https://api.github.com/graphql', headers=headers, json={'query': query, 'variables': variables})

    if response.status_code == 200:
        data = response.json()
        commits = data.get('data', {}).get('repository', {}).get('ref', {}).get('target', {}).get('history', {}).get('edges', [])
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
                added_lines = [line[1:] for line in lines if line.startswith("+") and not line.startswith("+++")]
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
                    added_lines = [line[1:] for line in lines if line.startswith("+") and not line.startswith("+++")]
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
    all_categories = []
    dev_query = "Analyze the following list of code additions from a GitHub commit and categorize them based on specific technologies, programming languages, or fields (e.g., Python, React, DevOps, Security, Database, Testing). Do not include general terms like 'programming languages,' 'frameworks,' or 'libraries.' Return exactly 5–10 relevant categories in a CSV format, with no extra text or formatting."

    for commit in commitData:
        additions_text = ""
        for file, lines in commit["additions"].items():
            additions_text += f"File: {file}\n"
            for line in lines:
                additions_text += f"+ {line}\n"

        if additions_text:
            gpt_response = queryGPT(additions_text, dev_query)
            if gpt_response:
                categories = [cat.strip() for cat in gpt_response.split(",")]
                all_categories.extend(categories)

    unique_categories = []
    seen = set()
    for category in all_categories:
        if category not in seen:
            unique_categories.append(category)
            seen.add(category)

    return unique_categories