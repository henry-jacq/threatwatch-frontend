#!/bin/bash

{
  # Top-level specific files
  [ -f .env ] && echo ".env"
  [ -f Dockerfile ] && echo "Dockerfile"

  # All files inside src/
  find ./src -type f 2>/dev/null
} |
while IFS= read -r file; do
  echo "=================================================="
  echo "FILE : $file"
  echo "LINES: $(wc -l < "$file")"
  echo "--------------------------------------------------"
  cat "$file"
  echo
done
