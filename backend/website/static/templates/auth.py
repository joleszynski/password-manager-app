import re
import jwt
import time
import bcrypt
import sqlite3
from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta, timezone
from cryptography.fernet import Fernet
from flask_cors import cross_origin

auth = Blueprint("auth", __name__)
JWT_SECRET = "965212cf707b41ff9a4cad2a914ed4f21786cbd30eb0f229354c6fae849513c6"
JWT_EXP_DELTA_MINUTES = 30

@auth.route("/register", methods=["POST", "OPTIONS"])
@cross_origin(origins="*",
              allow_headers=["Content-Type", "Authorization"])
def register():
    data = request.get_json()
    email = data.get("email")
    password = data.get("password")
    confirm_password = data.get("confirm_password")

    if not email or not password or not confirm_password:
        return jsonify({"error": "Wszystkie pola są wymagane"}), 400

    conn = sqlite3.connect("database.db")
    cursor = conn.cursor()
    cursor.execute("""
        SELECT * FROM users 
        WHERE email = ?
    """, (email,))
    user_exists = cursor.fetchone()

    if user_exists:
        conn.close()
        time.sleep(1.2)
        return jsonify({
            "message": "Możesz się zalogować"
        }), 200

    if not re.match(r"[^@]+@[^@]+\.[^@]+", email):
        conn.close()
        return jsonify({"error": "Niepoprawny adres email"}), 400

    if password != confirm_password:
        conn.close()
        return jsonify({"error": "Hasła się nie zgadzają"}), 400

    if len(password) < 8 or not re.search(r"[A-Z]", password) or not re.search(r"[0-9]", password) or not re.search(r"[!@#$%^&*(),.?\":{}|<>]", password):
        conn.close()
        return jsonify({"error": "Hasło musi mieć min. 8 znaków, 1 wielką literę, 1 cyfrę i znak specjalny"}), 400

    
    hashed_pw = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
    fernet_key = Fernet.generate_key().decode()

    try:
        cursor.execute("""
            INSERT INTO users (email, password, fernet_key) 
            VALUES (?, ?, ?)
        """, (email, hashed_pw, fernet_key))
        conn.commit()
        conn.close()
        return jsonify({
            "message": "Możesz się zalogować"
        }), 200
    except Exception as e:
        print("[BŁĄD REJESTRACJI]", e)
        return jsonify({"error": "Wewnętrzny błąd serwera"}), 500


@auth.route("/login", methods=["POST", "OPTIONS"])
@cross_origin(origins="*",
              allow_headers=["Content-Type", "Authorization"])
def login():
    data = request.get_json()
    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({"error": "Brakuje danych"}), 400

    try:
        conn = sqlite3.connect("database.db")
        cursor = conn.cursor()

        cursor.execute("""
            SELECT password, fernet_key FROM users 
            WHERE email = ?
        """, (email,))
        result = cursor.fetchone()
        conn.close()

        if not result:
            return jsonify({"error": "Nieprawidłowy email lub hasło"}), 401

        stored_hashed_pw, fernet_key = result

        if bcrypt.checkpw(password.encode(), stored_hashed_pw.encode()):
            payload = {
                "email": email,
                "fernet_key": fernet_key,
                "exp": datetime.now(timezone.utc) + timedelta(minutes=JWT_EXP_DELTA_MINUTES)
            }
            token = jwt.encode(payload, JWT_SECRET, algorithm="HS256")
            print(f"[INFO] Zalogowano: {email}")
            return jsonify({"message": "Zalogowano", "token": token}), 200
        else:
            return jsonify({"error": "Nieprawidłowy email lub hasło"}), 401

    except Exception as e:
        print("[BŁĄD LOGOWANIA]", e)
        return jsonify({"error": "Błąd serwera"}), 500
