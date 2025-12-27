@echo off
echo Running MangaKakalot Extractor Tests...
echo.
cd /d "%~dp0.."
node tests/test_mangakakalot_extractor.js
echo.
echo Tests completed. Press any key to exit.
pause > nul
