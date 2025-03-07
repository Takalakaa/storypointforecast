import pymongo
from flask_restful import Api
from flask import Flask, jsonify, request
import utils


def init_developer_skills():
    try:
        mongo_client = pymongo.MongoClient(utils.connection_string)
        db = mongo_client["db"]

        if "developerSkills" not in db.list_collection_names():
            sample_developers = [
                {
                    "name": "john_doe",
                    "python": 4,
                    "javascript": 3,
                    "mongodb": 2
                },
                {
                    "name": "jane_smith",
                    "java": 5,
                    "python": 2,
                    "aws": 4
                }
            ]

        db.developerSkills.insert_many(sample_developers)
        print("Sample developers inserted")

        return "Initialization complete"
    except Exception as e:
        return f"Error during initialization: {str(e)}"
