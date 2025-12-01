# backend/db.py
import os
from flask import g
import psycopg2
from psycopg2.extras import RealDictCursor

DATABASE_URL = os.environ.get("DATABASE_URL")


class PGDatabase:
    """
    Thin wrapper so sqlite-style code still works:

        db = get_db()
        cur = db.execute("SELECT * FROM users WHERE sub = ?", (sub,))
        row = cur.fetchone()
    """

    def __init__(self, conn):
        self.conn = conn

    def execute(self, query, params=None):
        # convert "?" placeholders to "%s" for psycopg2
        q = query.replace("?", "%s")
        cur = self.conn.cursor(cursor_factory=RealDictCursor)
        cur.execute(q, params or ())
        return cur

    def commit(self):
        self.conn.commit()

    def close(self):
        self.conn.close()


def get_db():
    if "db" not in g:
        if not DATABASE_URL:
            raise RuntimeError("DATABASE_URL is not set")
        conn = psycopg2.connect(DATABASE_URL)
        g.db = PGDatabase(conn)
    return g.db


def close_db(e=None):
    db = g.pop("db", None)
    if db is not None:
        db.close()


def init_db(app, schema_path="schema_pg.sql"):
    # run schema once on startup
    with app.app_context():
        db = get_db()
        with open(schema_path, "r", encoding="utf-8") as f:
            sql = f.read()
        for statement in sql.split(";"):
            stmt = statement.strip()
            if stmt:
                db.execute(stmt)
        db.commit()
