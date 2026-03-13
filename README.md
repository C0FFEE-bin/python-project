
# Django blueprint app

PyCharm can prepare the Python virtual environment automatically. If you are using VS Code or another editor, follow the steps below.

## Backend setup

1. Create a virtual environment:
   `python3 -m venv .venv`
2. Activate it:
   Windows: `.venv\Scripts\Activate`
   macOS/Linux: `source .venv/bin/activate`
3. Install Python dependencies:
   `pip3 install -r requirements.txt`

## Frontend setup

The home page is rendered by React and bundled with Vite.

1. Install Node dependencies from the repository root:
   `npm install`
2. Start the Vite dev server:
   `npm run dev`
3. In a second terminal, start Django from the `webapp` directory:
   `python manage.py runserver`

To let Django use the Vite dev server, set:

Windows PowerShell:
`$env:VITE_DEV_SERVER_URL='http://127.0.0.1:5173'`

macOS/Linux:
`export VITE_DEV_SERVER_URL='http://127.0.0.1:5173'`

If the variable is not set, Django serves the last built frontend bundle from `webapp/main/static/main/frontend/`.

## Build frontend assets

Run from the repository root:
`npm run build`

## Run Django only

If frontend assets were already built, you can just run:

1. `cd webapp`
2. `python manage.py runserver`

In some environments the command can be `python` instead of `python3`.

