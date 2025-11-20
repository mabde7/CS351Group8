import sqlite3
from flask import g
import os

DATABASE = "database.db"

def get_db():
    if "db" not in g:
        print(">>> USING DB FILE:", os.path.abspath(DATABASE))
        g.db = sqlite3.connect(DATABASE)
        g.db.row_factory = sqlite3.Row        
    return g.db

def close_db(e=None):
    db = g.pop("db", None)
    if db:
        db.close()

def init_db(app):
    # run schema.sql once on startup
    with app.app_context():
        db = get_db()
        with open("schema.sql", "r", encoding="utf-8") as f:
            db.executescript(f.read())
        db.commit()
