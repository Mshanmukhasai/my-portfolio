import logging
import os
from pathlib import Path
from typing import Any

from dotenv import load_dotenv
from bson import ObjectId
from pymongo import MongoClient
from pymongo.collection import Collection
from pymongo.database import Database
from pymongo.errors import CollectionInvalid, PyMongoError
from pymongo import ReturnDocument

load_dotenv(Path(__file__).resolve().parent / ".env")

logger = logging.getLogger(__name__)
MONGODB_URI = os.getenv("MONGODB_URI", "").strip()
MONGODB_DATABASE = os.getenv("MONGODB_DATABASE", "portfolio").strip() or "portfolio"

COLLECTION_NAMES = {
    "skills": "skills",
    "projects": "projects",
    "education": "education",
    "achievements": "achievements",
    "messages": "messages",
}

_client: MongoClient | None = None
_database: Database | None = None

DEFAULT_PROFILE = {
    "name": "Alex Morgan",
    "title": "AI & Full-Stack Developer",
    "introduction": (
        "I build thoughtful digital experiences and intelligent tools that turn complex ideas "
        "into useful, human-centered products."
    ),
    "email": "hello@example.com",
    "location": "Add your location",
    "linkedIn": "https://www.linkedin.com/in/your-profile/",
    "github": "https://github.com/your-username",
    "photo_url": None,
}

DEFAULT_SKILLS = [
    {"name": name, "category": category}
    for category, names in [
        ("Programming", ["Python", "Java", "C"]),
        ("Web Development", ["HTML", "CSS", "JavaScript"]),
        ("AI / ML", ["Machine Learning", "Data Analysis", "Computer Vision"]),
        ("Database", ["MySQL"]),
        ("Tools", ["Git", "GitHub", "VS Code"]),
    ]
    for name in names
]

DEFAULT_PROJECTS = [
    {
        "title": "AI-Based Plant Disease Detection",
        "description": "A computer vision tool that identifies common plant diseases from leaf images and helps growers take action sooner.",
        "category": "AI & ML",
        "image_url": "https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=1200&q=85",
        "image_alt": "Sunlight falling across vibrant green leaves",
        "technologies": ["Python", "TensorFlow", "OpenCV", "Flask"],
        "github_url": "https://github.com/your-username/plant-disease-detection",
        "demo_url": "https://example.com/plant-disease-detection",
    },
    {
        "title": "DNA Sequence Analysis Website",
        "description": "An interactive workspace for exploring DNA sequences, spotting patterns, and making bioinformatics more approachable.",
        "category": "Data",
        "image_url": "https://images.unsplash.com/photo-1530026405186-ed1f139313f8?auto=format&fit=crop&w=1200&q=85",
        "image_alt": "Colorful molecular model in a scientific laboratory",
        "technologies": ["JavaScript", "Python", "Biopython", "Flask"],
        "github_url": "https://github.com/your-username/dna-sequence-analysis",
        "demo_url": "https://example.com/dna-sequence-analysis",
    },
    {
        "title": "Supermarket Analysis Project",
        "description": "A data exploration project uncovering sales trends, customer preferences, and opportunities to improve retail performance.",
        "category": "Data",
        "image_url": "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=85",
        "image_alt": "Fresh produce arranged in a colorful market display",
        "technologies": ["Python", "Pandas", "Jupyter", "Matplotlib"],
        "github_url": "https://github.com/your-username/supermarket-analysis",
        "demo_url": "https://example.com/supermarket-analysis",
    },
    {
        "title": "Personal Portfolio Website",
        "description": "A considered home for selected work, skills, and background, designed to make the details feel as good as the first impression.",
        "category": "Web Development",
        "image_url": "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=85",
        "image_alt": "Laptop displaying a clean analytics dashboard",
        "technologies": ["React", "JavaScript", "CSS", "Vite"],
        "github_url": "https://github.com/your-username/personal-portfolio",
        "demo_url": "https://example.com/personal-portfolio",
    },
]


def connect_database() -> None:
    global _client, _database
    if not MONGODB_URI:
        raise RuntimeError("MONGODB_URI must be configured before starting the API.")
    try:
        client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=5000)
        client.admin.command("ping")
        _client = client
        _database = client[MONGODB_DATABASE]
        initialize_collections()
    except PyMongoError:
        logger.exception("Could not connect to MongoDB")
        if "client" in locals():
            client.close()
        raise


def close_database() -> None:
    global _client, _database
    if _client is not None:
        _client.close()
    _client = None
    _database = None


def get_database() -> Database:
    if _database is None:
        raise RuntimeError("MongoDB has not been initialized.")
    return _database


def initialize_collections() -> None:
    database = get_database()
    existing_collections = set(database.list_collection_names())
    newly_created_collections = set()
    for collection_name in ("profile", "skills", "projects", "education", "achievements", "messages"):
        if collection_name not in existing_collections:
            try:
                database.create_collection(collection_name)
                newly_created_collections.add(collection_name)
            except CollectionInvalid:
                logger.info("Collection %s was created concurrently", collection_name)
    database["profile"].update_one(
        {"_id": "main"},
        {"$setOnInsert": DEFAULT_PROFILE},
        upsert=True,
    )
    for collection_name, defaults in (
        ("skills", DEFAULT_SKILLS),
        ("projects", DEFAULT_PROJECTS),
        ("education", []),
        ("achievements", []),
        ("messages", []),
    ):
        collection = database[collection_name]
        if collection_name in newly_created_collections and defaults:
            collection.insert_many(defaults)


def list_entities(entity: str, *, newest_first: bool = False) -> list[dict[str, Any]]:
    collection = _get_collection(entity)
    sort_order = -1 if newest_first else 1
    return [_serialize_document(document) for document in collection.find().sort("_id", sort_order)]


def create_entity(entity: str, values: dict[str, Any]) -> dict[str, Any]:
    collection = _get_collection(entity)
    result = collection.insert_one(values)
    document = collection.find_one({"_id": result.inserted_id})
    if document is None:
        raise RuntimeError(f"Created {entity} document could not be retrieved.")
    return _serialize_document(document)


def update_entity(entity: str, item_id: str, values: dict[str, Any]) -> dict[str, Any] | None:
    collection = _get_collection(entity)
    object_id = _parse_object_id(item_id)
    if not values:
        document = collection.find_one({"_id": object_id})
    else:
        result = collection.find_one_and_update(
            {"_id": object_id},
            {"$set": values},
            return_document=ReturnDocument.AFTER,
        )
        document = result
    return _serialize_document(document) if document is not None else None


def delete_entity(entity: str, item_id: str) -> bool:
    collection = _get_collection(entity)
    result = collection.delete_one({"_id": _parse_object_id(item_id)})
    return result.deleted_count == 1


def read_profile() -> dict[str, Any]:
    document = get_database()["profile"].find_one({"_id": "main"})
    if document is None:
        raise RuntimeError("The profile document is missing.")
    return _serialize_document(document)


def update_profile(values: dict[str, Any]) -> dict[str, Any]:
    collection = get_database()["profile"]
    collection.update_one({"_id": "main"}, {"$set": values}, upsert=True)
    return read_profile()


def create_message(values: dict[str, Any]) -> dict[str, Any]:
    return create_entity("messages", values)


def _get_collection(entity: str) -> Collection:
    collection_name = COLLECTION_NAMES.get(entity)
    if collection_name is None:
        raise ValueError(f"Unsupported collection: {entity}")
    return get_database()[collection_name]


def _parse_object_id(item_id: str) -> ObjectId:
    if not ObjectId.is_valid(item_id):
        raise ValueError("Invalid record ID.")
    return ObjectId(item_id)


def _serialize_document(document: dict[str, Any]) -> dict[str, Any]:
    return {**document, "_id": str(document["_id"]), "id": str(document["_id"])}
