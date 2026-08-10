@echo off
setlocal
node "%~dp0session-start"
exit /b %ERRORLEVEL%
