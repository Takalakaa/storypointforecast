import pymongo
from flask_restful import Api
from flask import Flask, jsonify, request
import utils


def init_developer_skills():
    try:
        mongo_client = pymongo.MongoClient(utils.connection_string)
        db = mongo_client["db"]

        # Drop collection if it exists
        if "developerSkills" in db.list_collection_names():
            db.developerSkills.drop()
            print("developerSkills collection dropped")

        # Create new collection
        db.create_collection("developerSkills")
        print("developerSkills collection created")

        # Example initial documents with lowercase skills
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

        # Insert sample data
        db.developerSkills.insert_many(sample_developers)
        print("Sample developers inserted")

        return "Initialization complete"
    except Exception as e:
        return f"Error during initialization: {str(e)}"
