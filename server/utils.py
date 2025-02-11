from flask import Flask
from flask_restful import Resource, Api
import secrets
import pymongo
import datetime

HEADSTRING = "mongodb://"
base_url = "localhost:"
port = "27017"


connection_string = HEADSTRING + base_url + port

def make_connection(db):
    mongo_client = pymongo.MongoClient(connection_string)
    db_access = mongo_client[db]
    return(db_access)

def login(user, hashedPass):
    db = make_connection("users")
    result = db.authentication.find({"name": user, "password": hashedPass})
    if(result == []):
        return 0
    name = result["name"]
    session_key = secrets.token_urlsafe(32)
    db.authentication.find_one_and_replace({"name": user, "password": hashedPass},{"session_token": session_key})
    return [name, session_key]

def logout(user, session_key):
    db = make_connection("users")
    result = db.authentication.find({"name": user, "session_token": session_key})
    if(result == []):
        return False
    db.authentication.find_one_and_replace({"name": user, "session_token": session_key},{"session_token": None})
    return True

def addUser(name, role, password):
    db = make_connection("users")
    return db.authentication.insert_one({"name": name, "password": password, "role": role})