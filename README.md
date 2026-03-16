# Django blueprint app

## Requirements

- Python 3.12+
- Node.js 20+
- Git

## Clone repository

Clone the project and enter the directory:

```powershell
git clone https://github.com/C0FFEE-bin/python-project.git django-blueprint-app
cd django-blueprint-app
```

## Install backend

Create and activate a virtual environment, then install Python dependencies.

Windows PowerShell:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate
pip install -r requirements.txt
```

macOS/Linux:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Install frontend

From the repository root:

```powershell
npm install
```

If PowerShell blocks `npm`, use:

```powershell
npm.cmd install
```

## Run Django only

If you want to run the app with the built frontend bundle:

```powershell
.\run-django.cmd
```

Alternative:

```powershell
npm.cmd run django
```

The app will be available at `http://127.0.0.1:8000/`.

## Run Django + Vite dev server

Use this mode if you want live frontend changes while editing React files.

Terminal 1:

```powershell
npm run dev
```

If `npm` is blocked in PowerShell:

```powershell
npm.cmd run dev
```

Terminal 2, Windows PowerShell:

```powershell
$env:VITE_DEV_SERVER_URL='http://127.0.0.1:5173'
.\run-django.cmd
```

Terminal 2, macOS/Linux:

```bash
export VITE_DEV_SERVER_URL='http://127.0.0.1:5173'
node ./scripts/run-django.mjs runserver
```

Then open:

- Django: `http://127.0.0.1:8000/`
- Vite dev server: `http://127.0.0.1:5173/`

If `VITE_DEV_SERVER_URL` is not set, Django serves the built frontend bundle from `webapp/main/static/main/frontend/`.

## Build frontend assets

Build the production frontend bundle from the repository root:

```powershell
npm run build
```

If needed in PowerShell:

```powershell
npm.cmd run build
```

## Useful commands

Run Django checks:

```powershell
node ./scripts/run-django.mjs check
```

Run Django tests:

```powershell
node ./scripts/run-django.mjs test
```

Run another Django management command from the repository root:

```powershell
node ./scripts/run-django.mjs <command>
```
