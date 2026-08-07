@echo off
REM Inicializa o servidor CERNE e abre o navegador padrão
cd /d "%~dp0"
if not exist node_modules (echo Dependências não instaladas. Execute npm install primeiro.& pause & exit /b)
start "" "http://localhost:3000"
node server.js
