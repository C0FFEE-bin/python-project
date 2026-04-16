# Rent a Nerd

Rent a Nerd to aplikacja webowa w Django z frontem React/Vite do wyszukiwania korepetytorow, przegladania ich profili, obserwowania aktywnych tutorow oraz prowadzenia podstawowego przeplywu kontaktu uczen-tutor.

## Najwazniejsze funkcjonalnosci

- rejestracja, logowanie i wylogowanie uzytkownikow,
- onboarding konta ucznia lub korepetytora,
- wyszukiwarka tutorow po przedmiocie, temacie, poziomie, dacie i godzinie,
- profil korepetytora z dostepnymi terminami i wysylka zapytania o zajecia,
- portal z wpisami tutorow oraz lista obserwowanych profili,
- dashboard korepetytora,
- widok wiadomosci dla korepetytora,
- strona `About` i obsluga bledu bazy danych.

## Technologie

- Python 3.12
- Django 5.1.6
- SQLite 3
- JavaScript (ES modules)
- React 19
- Vite 8
- npm / package-lock do zarzadzania zaleznosciami frontendu

## Wymagania systemowe

- Python `3.12+`
- Node.js `20+`
- npm `10+`
- Git

## Instalacja

### 1. Sklonowanie repozytorium

```powershell
git clone <repo-url>
cd django-blueprint-app
```

### 2. Srodowisko wirtualne i backend

Windows PowerShell:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate
pip install -r requirements.txt
```

macOS / Linux:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### 3. Frontend

```powershell
npm install
```

## Konfiguracja srodowiska

Projekt odczytuje zmienne z pliku `.env` w katalogu glownym repozytorium. Przykladowa konfiguracja znajduje sie w pliku [`.env.example`](./.env.example).

Najwazniejsze zmienne:

- `DJANGO_SECRET_KEY` - klucz Django,
- `DJANGO_DEBUG` - tryb developerski (`True` / `False`),
- `DJANGO_ALLOWED_HOSTS` - lista hostow rozdzielona przecinkami,
- `DJANGO_DB_PATH` - opcjonalna sciezka do lokalnej bazy SQLite,
- `VITE_DEV_SERVER_URL` - adres serwera Vite dla developmentu,
- `SEED_TUTOR_PASSWORD` - opcjonalne haslo dla seedowych kont tutorow.

Przyklad minimalnego `.env` dla developmentu:

```env
DJANGO_SECRET_KEY=dev-secret-key-change-me
DJANGO_DEBUG=True
DJANGO_ALLOWED_HOSTS=127.0.0.1,localhost
```

## Migracje bazy danych

Z poziomu katalogu glownego repozytorium:

```powershell
node .\scripts\run-django.mjs migrate
```

## Dane testowe

Aby wypelnic aplikacje przykladowymi tutorami, przedmiotami, opiniami i terminami:

```powershell
node .\scripts\run-django.mjs seed_tutors
```

Wazne:

- jezeli `SEED_TUTOR_PASSWORD` nie jest ustawione, seedowe konta auth dostana hasla nieaktywne i nie bedzie mozna sie na nie zalogowac,
- w takim przypadku konto testowe najlepiej utworzyc przez formularz rejestracji pod adresem `/register`,
- seed tworzy dane do wyszukiwarki i portalu niezaleznie od logowania seedowymi kontami.

Przyklad z aktywnym haslem dla seedow:

```powershell
$env:SEED_TUTOR_PASSWORD="Tutor123!"
node .\scripts\run-django.mjs seed_tutors
```

## Uruchomienie aplikacji

### Wariant 1: Django + zbudowane assety frontendu

Najpierw zbuduj frontend:

```powershell
npm run build
```

Nastepnie uruchom Django:

```powershell
node .\scripts\run-django.mjs runserver
```

Aplikacja bedzie dostepna pod adresem `http://127.0.0.1:8000/`.

### Wariant 2: Django + Vite dev server

Jednym poleceniem uruchomisz frontend i backend:

```powershell
npm run dev
```

Skrypt startuje Vite i Django rownolegle. Domyslnie oba procesy uzywaja `http://127.0.0.1:5173`, ale jezeli nadpiszesz `VITE_DEV_SERVER_URL`, frontend wystartuje na tym samym hoscie i porcie, a backend dostanie zgodny adres dev servera.

Jesli chcesz uruchomic je osobno, nadal sa dostepne:

```powershell
npm run dev:frontend
npm run dev:backend
```

Adresy:

- Django: `http://127.0.0.1:8000/`
- Vite: `http://127.0.0.1:5173/`

## Testy i walidacja projektu

Sprawdzenie konfiguracji Django:

```powershell
node .\scripts\run-django.mjs check
```

Uruchomienie testow:

```powershell
node .\scripts\run-django.mjs test
```

## Struktura projektu

```text
django-blueprint-app/
|-- frontend/                 # kod frontendu React/Vite
|   `-- src/home/             # glowny interfejs aplikacji
|-- scripts/                  # helpery uruchamiania Django z poziomu repo
|-- webapp/
|   |-- main/                 # glowna aplikacja Django: modele, widoki, formularze, testy
|   |-- webapp/               # konfiguracja projektu Django (settings, urls, wsgi, asgi)
|   `-- manage.py
|-- requirements.txt          # zaleznosci Pythona
|-- package.json              # zaleznosci frontendu
`-- run-django.cmd            # windowsowy helper do uruchomienia serwera
```

## Testowanie reczne po instalacji

1. Zarejestruj konto ucznia lub korepetytora.
2. Wejdz do wyszukiwarki i znajdz korepetytora.
3. Otworz profil tutora i wyslij zapytanie o zajecia.
4. Dla konta korepetytora sprawdz dashboard, portal i widok wiadomosci.

## Uwagi organizacyjne przed oddaniem

- repozytorium powinno byc publiczne albo udostepnione prowadzacej,
- nalezy dodac `ukenSvitlanaDidkivska` jako collaborator,
- przed oddaniem warto uruchomic `check`, `test`, `build` oraz sprawdzic, czy lokalna baza `db.sqlite3` nie jest sledzona przez Git.
