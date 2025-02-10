import pymongo
from flask_restful import Api
from flask import Flask, jsonify, request
import utils


def init_developer_skills():
    try:
        mongo_client = pymongo.MongoClient(utils.connection_string)
        db = mongo_client["db"]

        # Check if collection exists, if it does, don't recreate
        if "DeveloperSkills" not in db.list_collection_names():
            db.create_collection("DeveloperSkills")
            print("DeveloperSkills collection created")

            # Example initial documents
            sample_developers = [
                {
                    "name": "John Doe",
                    "Python": 4,
                    "JavaScript": 3,
                    "MongoDB": 2
                },
                {
                    "name": "Jane Smith",
                    "Java": 5,
                    "Python": 2,
                    "AWS": 4
                }
            ]

            # Insert sample data
            db.DeveloperSkills.insert_many(sample_developers)
            print("Sample developers inserted")

        return "Initialization complete"
    except Exception as e:
        return f"Error during initialization: {str(e)}"

# Example route to add a new developer


# @app.route('/add_developer', methods=['POST'])
# def add_developer():
#     try:
#         data = request.json
#         if 'name' not in data:
#             return "Name is required", 400

#         # All skills will default to 0 if not provided
#         developer_doc = {"name": data["name"]}

#         # Add any provided skills (must be between 0-5)
#         for skill, level in data.items():
#             if skill != "name":
#                 if not isinstance(level, int) or level < 0 or level > 5:
#                     return f"Skill level for {skill} must be between 0-5", 400
#                 developer_doc[skill] = level

#         mongo_client = pymongo.MongoClient(utils.connection_string)
#         db = mongo_client["db"]
#         result = db.DeveloperSkills.insert_one(developer_doc)

#         return str(result.inserted_id)
#     except Exception as e:
#         return str(e), 500

init_developer_skills()
