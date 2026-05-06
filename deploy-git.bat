@echo off
echo ========================================
echo   MoneyLens - Enviar para GitHub
echo ========================================
echo.

cd "D:\PROJETOS MINIMAX\money-lens"

echo Verificando status do Git...
git status

echo.
echo Adicionando arquivos...
git add .

echo.
echo Fazendo commit...
git commit -m "MoneyLens v1.0 - Acessor Financeiro"

echo.
echo ========================================
echo PRONTO! Agora voce precisa:
echo 1. Substituir SEU_USER pelo seu usuario GitHub
echo 2. Rodar: git remote set-url origin https://github.com/SEU_USER/money-lens.git
echo 3. Rodar: git push -u origin main
echo ========================================
pause
