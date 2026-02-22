@echo off
set /p msg="Introduce el mensaje del commit: "
git add .
git commit -m "%msg%"
git push origin main
echo.
echo ¡Repo actualizado con éxito!
pause