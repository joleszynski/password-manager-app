import os
import sqlite3

def init_db():
    if not os.path.exists("database.db"):
        conn = sqlite3.connect("database.db")
        cursor = conn.cursor()
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            fernet_key TEXT NOT NULL
        )
        """)
        conn.commit()
        conn.close()

def init_passwords_db():
    if not os.path.exists("passwords.db"):
        conn = sqlite3.connect("passwords.db")
        cursor = conn.cursor()
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS passwords (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_email TEXT NOT NULL,
            site TEXT NOT NULL,
            login TEXT NOT NULL,
            password TEXT NOT NULL
        )
        """)
        conn.commit()
        conn.close()
