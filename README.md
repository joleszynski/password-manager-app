# SecureVault - Password Manager aka Hasełka - aplikacja do bezpiecznego przechowywania haseł

## Opis

Jest to prosta aplikacja do zarządzania zaszyfrowanymi hasłami.

Użyte technologie do napisania aplikacji:
- Backend: Python z użyciem Flask, która korzysta z dwóch plikowych baz danych SQLite.
- Frontend: Vanilla JS, która tak naprawdę działa na jednym pliku .js.

### Funkcjonalności

- Każdy użytkownik ma indywidualny klucz szyfrowania (Fernet), generowany podczas rejestracji
- Hasła są szyfrowane przed zapisem do bazy i odszyfrowywane tylko na żądanie użytkownika
- Logowanie i rejestracja odbywa się przez endpointy REST
- Autoryzacja do operacji na hasłach odbywa się przez token JWT przekazywany w nagłówku Authorization

## Jak uruchomić?

### 1. Instalacja wymaganych bibliotek

```bash
# Utwórz środowisko wirtualne
python -m venv nazwa_srodowiska

# Komenda dla Windows Command Prompt
nazwa_srodowiska\Scripts\activate

# Komenda dla Windows PowerShell
nazwa_srodowiska\Scripts\Activate.ps1

# Komenda dla Git Bash
source nazwa_srodowiska/Scripts/activate

# Komenda dla macOS / Linux
source nazwa_srodowiska/bin/activate

# Zainstaluj biblioteki
pip install -r requirements.txt

# Uruchom aplikacje
python main,py
```

### 2. Struktura plików

Upewnij się, że masz pliki:

- `password-maanager-app`
  - `backend`
    - `main.py`
    - `requirements.txt`
    - `website/static/templates/`
        - `__init__.py`
        - `models.py`
        - `auth.py`
        - `passwords.py`
  - `frontend`
    - `index.html`
    - `js`
      - `app.js`
    - `css`
      - `styles.css`


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