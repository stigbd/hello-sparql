"""API endpoints for running SHACL validation on RDF data."""

import logging

from fastapi import APIRouter
from pydantic import BaseModel
from rdflib import Graph

router = APIRouter(tags=["rdf"])
logger = logging.getLogger("prefixes")


class Prefix(BaseModel):
    """Model for an RDF prefix and its corresponding namespace."""

    prefix: str
    namespace: str


@router.get(
    "/prefixes",
    responses={
        200: {
            "description": "List of RDF prefixes and their corresponding namespaces",
        },
    },
)
async def get_prefixes() -> list[Prefix]:
    """Get a list of prefixes order alphabetically by prefix."""
    return [
        Prefix(prefix=prefix[0], namespace=prefix[1])
        for prefix in sorted(Graph().namespace_manager.namespaces(), key=lambda x: x[0])
    ]
