from flask import Flask, Response, jsonify
from flask_restful import Resource, Api
import secrets
import pymongo
import datetime
import logging
import json

HEADSTRING = "mongodb://"
base_url = "localhost:"
port = "27017"


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
    if(result != None):
        filter = {'name' : active_user}
        newValues = { "$set": { 'name': name,'role' : role, 'git_name' : git_name } }
        output = db.authentication.update_one(filter, newValues)
        return Response([str(output.upserted_id), str(output.acknowledged)], status=200, mimetype='application/json')
    else:
        return Response("{'error':'User does not exist'}", status=201, mimetype='application/json')
    

def logout(user, session_key):
    db = make_connection("users")
    result = db.authentication.find({"name": user, "session_token": session_key})
    if(result == []):
        return False
    db.authentication.find_one_and_replace({"name": user, "session_token": session_key},{"session_token": None})
    return True

def addUser(name, role, password, git_name):
    db = make_connection("users")
    result = db.authentication.find_one({"name": name, "role": role})
    if(result == None):
        output = db.authentication.insert_one({"name": name, "password": password, "role": role, "git_name": git_name})
        return Response([str(output.inserted_id), str(output.acknowledged)], status=200, mimetype='application/json')
    else:
        return Response("{'error':'User already exists'}", status=201, mimetype='application/json')