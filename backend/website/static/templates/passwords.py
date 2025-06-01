import jwt
import sqlite3
from flask import Blueprint, request, jsonify
from cryptography.fernet import Fernet
from flask_cors import cross_origin

passwords_bp = Blueprint("passwords", __name__)
JWT_SECRET = "965212cf707b41ff9a4cad2a914ed4f21786cbd30eb0f229354c6fae849513c6"

def get_user_info():
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return None, None
    token = auth_header.split(" ")[1]
    try:
        decoded = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        return decoded["email"], decoded.get("fernet_key")
    except Exception:
        return None, None

@passwords_bp.route("/passwords", methods=["GET", "OPTIONS"])
@cross_origin(origins="*", allow_headers=["Content-Type", "Authorization"])
def get_passwords():
    from cryptography.fernet import Fernet

    email, key = get_user_info()
    if not email or not key:
        print("[BŁĄD] Brak e-maila lub klucza w tokenie")
        return jsonify({"error": "Nieautoryzowany dostęp"}), 401

    try:
        cipher = Fernet(key.encode())
    except Exception as e:
        print("[BŁĄD] Nie udało się utworzyć obiektu Fernet:", e)
        return jsonify({"error": "Błąd szyfrowania"}), 500

    try:
        conn = sqlite3.connect("passwords.db")
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, site, login, password FROM passwords 
            WHERE user_email = ?
        """, (email,))
        data = cursor.fetchall()
        conn.close()
    except Exception as e:
        print("[BŁĄD BAZY DANYCH]", e)
        return jsonify({"error": "Błąd bazy danych"}), 500

    passwords = []
    for row in data:
        try:
            decrypted_password = cipher.decrypt(row[3].encode()).decode()
        except Exception as e:
            print(f"[BŁĄD ODSZYFROWANIA] ID: {row[0]}, Błąd: {e}")
            decrypted_password = "Błąd szyfrowania"

        passwords.append({
            "id": row[0],
            "site": row[1],
            "login": row[2],
            "password": decrypted_password
        })

    return jsonify(passwords), 200


@passwords_bp.route("/passwords", methods=["POST"])
@cross_origin(origins="*", allow_headers=["Content-Type", "Authorization"])
def add_password():
    email, _ = get_user_info()
    if not email:
        return jsonify({"error": "Nieautoryzowany dostęp"}), 401

    data = request.get_json()
    site = data.get("site")
    login = data.get("login")
    password = data.get("password")

    conn = sqlite3.connect("passwords.db")
    cursor = conn.cursor()

    user_cursor = sqlite3.connect("database.db").cursor()
    user_cursor.execute("""
        SELECT fernet_key FROM users 
        WHERE email = ?
    """, (email,))
    user = user_cursor.fetchone()
    user_cursor.connection.close()

    if not user:
        return jsonify({"error": "Użytkownik nie istnieje"}), 404

    fernet = Fernet(user[0].encode())
    encrypted_password = fernet.encrypt(password.encode()).decode()

    cursor.execute("""
        INSERT INTO passwords (user_email, site, login, password) 
        VALUES (?, ?, ?, ?)
    """, (email, site, login, encrypted_password))
    conn.commit()
    conn.close()

    return jsonify({"message": "Hasło zapisane"}), 201

@passwords_bp.route("/passwords/<int:id>", methods=["PUT"])
@cross_origin(origins="*", allow_headers=["Content-Type", "Authorization"])
def update_password(id):
    email, _ = get_user_info()
    if not email:
        return jsonify({"error": "Nieautoryzowany dostęp"}), 401

    data = request.get_json()
    site = data.get("site")
    login = data.get("login")
    password = data.get("password")

    conn = sqlite3.connect("passwords.db")
    cursor = conn.cursor()

    user_cursor = sqlite3.connect("database.db").cursor()
    user_cursor.execute("""
        SELECT fernet_key FROM users 
        WHERE email = ?
    """, (email,))
    user = user_cursor.fetchone()
    user_cursor.connection.close()

    if not user:
        return jsonify({"error": "Użytkownik nie istnieje"}), 404

    fernet = Fernet(user[0].encode())
    encrypted_password = fernet.encrypt(password.encode()).decode()

    cursor.execute("""
        UPDATE passwords
        SET site = ?, login = ?, password = ?
        WHERE id = ? AND user_email = ?
    """, (site, login, encrypted_password, id, email))
    conn.commit()
    conn.close()

    return jsonify({"message": "Hasło zaktualizowane"}), 200

@passwords_bp.route("/passwords/<int:id>", methods=["DELETE"])
@cross_origin(origins="*", allow_headers=["Content-Type", "Authorization"])
def delete_password(id):
    email, _ = get_user_info()
    if not email:
        return jsonify({"error": "Nieautoryzowany dostęp"}), 401

    conn = sqlite3.connect("passwords.db")
    cursor = conn.cursor()
    cursor.execute("""
        DELETE FROM passwords 
        WHERE id = ? 
        AND user_email = ?
    """, (id, email))
    conn.commit()
    conn.close()

    return jsonify({"message": "Hasło usunięte"}), 200