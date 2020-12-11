#!/bin/bash

PDFIX_VERSION=6.5.0
PDFIX_DIR="pdfix_sdk_${PDFIX_VERSION}_wasm"
ARCHIVE_FILENAME="${PDFIX_DIR}.zip"
DOWNLOAD_URL="https://github.com/pdfix/pdfix_sdk_builds/releases/download/${PDFIX_VERSION}/${ARCHIVE_FILENAME}"

if [ ! -d ./pdfix ]; then
  info "pdfix does not exist. Creating directory..."
  mkdir ./pdfix
fi

pushd ./pdfix

if [ ! -f ./$ARCHIVE_FILENAME ]; then
  info "Archive not found. Downloading..."
  curl -OL $DOWNLOAD_URL
  exit_if_error $? "Download Failed: ${DOWNLOAD_URL}"
fi

info "Cleaning directory..."
find . -type f ! -name '*.zip' -delete
find . -type l -delete

info "Extracting: ${ARCHIVE_FILENAME}"
unzip -jo $ARCHIVE_FILENAME "${PDFIX_DIR}/*"
rm $ARCHIVE_FILENAME

popd