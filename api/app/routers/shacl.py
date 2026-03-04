"""API endpoints for running SHACL validation on RDF data."""

import logging
from http import HTTPStatus

from fastapi import APIRouter, Depends, HTTPException, Request, Response
from pydantic import BaseModel
from pyshacl import validate
from rdflib import Graph
from rdflib.exceptions import ParserError

router = APIRouter(tags=["shacl"])
logger = logging.getLogger("uvicorn.error")


class SHACLRequest(BaseModel):
    """Request model for running a SHACL validation on RDF data."""

    data: str
    shapes: str


async def check_content_type(request: Request) -> None:
    """Check that the content type of the request is application/json."""
    content_type = request.headers.get("content-type", None)
    if not content_type or "application/json" not in content_type:
        raise HTTPException(
            status_code=HTTPStatus.UNSUPPORTED_MEDIA_TYPE,
            detail=f"Unsupported media type {content_type}",
        )


@router.post(
    "/shacl",
    dependencies=[Depends(check_content_type)],
    responses={
        200: {
            "description": "Result of running the SHACL validation",
            "content": {
                "text/plain": {},
                "application/json": {},
                "text/csv": {},
                "text/xml": {},
            },
        },
    },
)
async def run_shacl(shacl_request: SHACLRequest) -> Response:
    """Run the given SHACL validation on the provided RDF data."""
    # Parse the RDF data into a graph:
    data_graph = Graph()
    try:
        data_graph.parse(data=shacl_request.data)
    except ParserError as e:
        msg = "Invalid RDF data: " + str(e)
        raise HTTPException(status_code=400, detail=msg) from e

    # Parse the SHACL shapes into a graph:
    shapes_graph = Graph()
    try:
        shapes_graph.parse(data=shacl_request.shapes)
    except ParserError as e:
        msg = "Invalid SHACL shapes: " + str(e)
        raise HTTPException(status_code=400, detail=msg) from e

    # Validate the
    _, results_graph, _ = validate(data_graph=data_graph, shacl_graph=shapes_graph)
    # Serialize the result:
    try:
        content = results_graph.serialize(format="turtle")
        return Response(content=content, media_type="text/turtle")
    except Exception as e:  # pragma: no cover
        msg = "Error serializing query results: " + str(e)
        raise HTTPException(status_code=400, detail=msg) from e
