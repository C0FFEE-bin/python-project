@echo off
setlocal

set "PYTHON_EXE=%~dp0.venv\Scripts\python.exe"
set "MANAGE_PY=%~dp0webapp\manage.py"

if not exist "%PYTHON_EXE%" (
  echo Virtual environment Python not found at "%PYTHON_EXE%".
  exit /b 1
)

if not exist "%MANAGE_PY%" (
  echo manage.py not found at "%MANAGE_PY%".
  exit /b 1
)

"%PYTHON_EXE%" "%MANAGE_PY%" runserver %*
