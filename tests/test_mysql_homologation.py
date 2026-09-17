import os

import pytest


@pytest.mark.mysql
def test_mysql_homologation_database_is_active(db_session):
    """Evita que o gate de homologação passe acidentalmente usando SQLite."""
    if not os.environ.get("TEST_DATABASE_URL"):
        pytest.skip("MySQL de homologação não configurado")

    assert db_session.bind.dialect.name == "mysql"
