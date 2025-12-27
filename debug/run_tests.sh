#!/bin/bash
echo "Running MangaKakalot Extractor Tests..."
echo
cd "$(dirname "$0")/.."
node tests/test_mangakakalot_extractor.js
echo
echo "Tests completed."
