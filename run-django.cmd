@echo off
setlocal

set "PYTHON_EXE=%~dp0.venv\Scripts\python.exe"
set "MANAGE_PY=%~dp0webapp\manage.py"
set "DJANGO_DIR=%~dp0webapp"

if not exist "%PYTHON_EXE%" (
  echo Virtual environment Python not found at "%PYTHON_EXE%".
  exit /b 1
)

if not exist "%MANAGE_PY%" (
  echo manage.py not found at "%MANAGE_PY%".
  exit /b 1
)

pushd "%DJANGO_DIR%"
"%PYTHON_EXE%" manage.py runserver %*
set "EXIT_CODE=%ERRORLEVEL%"
popd
exit /b %EXIT_CODE%
