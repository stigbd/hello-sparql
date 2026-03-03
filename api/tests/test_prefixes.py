"""Test module for api."""

from http import HTTPStatus

import pytest
from httpx import ASGITransport, AsyncClient

from app import app


@pytest.fixture
def anyio_backend() -> str:
    """Use the asyncio backend for the anyio fixture."""
    return "asyncio"


@pytest.mark.anyio
async def test_get_prefixes() -> None:
    """Test the /prefixes endpoint."""
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        response = await ac.get("/prefixes")
        assert response.status_code == HTTPStatus.OK
        prefixes = response.json()
        assert isinstance(prefixes, list)
        assert len(prefixes) > 0
        for prefix in prefixes:
            assert "prefix" in prefix
            assert "namespace" in prefix
            assert isinstance(prefix["prefix"], str)
            assert isinstance(prefix["namespace"], str)
