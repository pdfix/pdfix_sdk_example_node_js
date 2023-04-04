#!/bin/bash

PDFIX_VERSION=6.20.0
PDFIX_VERSION_TAG=e464a0c7
PDFIX_DIR="pdfix_sdk_${PDFIX_VERSION}_${PDFIX_VERSION_TAG}_wasm"
ARCHIVE_FILENAME="${PDFIX_DIR}.zip"
DOWNLOAD_URL="https://github.com/pdfix/pdfix_sdk_builds/releases/download/${PDFIX_VERSION}/${ARCHIVE_FILENAME}"

if [ ! -d ./pdfix ]; then
  echo "pdfix does not exist. Creating directory..."
  mkdir ./pdfix
fi

cd ./pdfix

if [ ! -f ./$ARCHIVE_FILENAME ]; then
  echo "Archive not found. Downloading..."
  curl -OL $DOWNLOAD_URL
fi

echo "Cleaning directory..."
find . -type f ! -name '*.zip' -delete
find . -type l -delete

echo "Extracting: ${ARCHIVE_FILENAME}"
unzip -jo $ARCHIVE_FILENAME "*"
rm $ARCHIVE_FILENAME