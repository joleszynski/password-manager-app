# Hasełka - aplikacja do bezpiecznego przechowywania haseł

## Opis

Jest to prosta aplikacja do zarządzania zaszyfrowanymi hasłami.

Aplikacja napisana jest w:
- Backend: Pythonie z użyciem Flask, która korzysta z dwóch plikowych baz danych SQLite.
- Frontend: Vanilla JS.

### Funkcjonalności

- Każdy użytkownik ma indywidualny klucz szyfrowania (Fernet), generowany podczas rejestracji
- Hasła są szyfrowane przed zapisem do bazy i odszyfrowywane tylko na żądanie użytkownika
- Logowanie i rejestracja odbywa się przez endpointy REST
- Autoryzacja do operacji na hasłach odbywa się przez token JWT przekazywany w nagłówku Authorization

## Jak uruchomić?

### 1. Instalacja wymaganych bibliotek

```bash
pip install flask flask-cors pyjwt bcrypt cryptography
```

### 2. Struktura plików

Upewnij się, że masz pliki:

- `main.py`
- folder z backendem, np. `website/static/templates/`, w nim pliki:
	- `__init__.py`
	- `models.py`
	- `auth.py`
	- `passwords.py`

### 3. Uruchomienie backend

```bash
python main.py
```

### 4. Uruchomienie frontend
Wklej ścieżkę absolutną do pliku index.html w przeglądarce.

## Endpointy

| Metoda | Endpoint | Opis |
|--------|----------|------|
| `POST` | `/api/register` | Rejestracja użytkownika |
| `POST` | `/api/login` | Logowanie (zwraca JWT) |
| `GET` | `/api/passwords` | Pobranie listy haseł użytkownika |
| `POST` | `/api/passwords` | Dodanie nowego hasła |
| `PUT` | `/api/passwords/<id>` | Edycja istniejącego hasła |
| `DELETE` | `/api/passwords/<id>` | Usunięcie hasła |