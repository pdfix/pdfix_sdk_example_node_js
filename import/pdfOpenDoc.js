/**
 * @copyright 2020 Pdfix. All Rights Reserved.
 * 
 * @fileoverview Contains and exports function pdfOpenDoc @see {pdfOpenDoc} using helpers:
 * @see {psOpenFileAsync}
 * @see {psOpenFileFs}
 * @see {psMakeXhrRequest}
 * @see {pdfixOpenDocFromStream}
 * 
 * @typedef {Object} requestData Request data for opening the document.
 * @property {string} type psOpenFileAsync | psMakeXhrRequest | psOpenFileFs.
 * @property {File|string} file File object | URL | absolute or relative path.
 */

/**
 * Opens a document from various source types.
 * @async @function pdfOpenDoc
 * @param {Object} sdk WASM instance of the PDFix SDK.
 * @param {requestData} requestData Request data for opening the document.
 * @returns {Promise<Object>} Promise object representing a PDF document.
 */
async function pdfOpenDoc(sdk, requestData) {
  let openType = requestData.type;
  let file = requestData.file;
  let fileArrayBuffer;
  if ( openType == 'psOpenFileAsync' ) {
    fileArrayBuffer = await psOpenFileAsync(file);
  }
  else if ( openType == 'psMakeXhrRequest' ) {
    fileArrayBuffer = await psMakeXhrRequest('GET', file);
  }
  else if ( openType == 'psOpenFileFs' ) {
    fileArrayBuffer = await psOpenFileFs(file);
  }
  let pdfDoc = await pdfixOpenDocFromStream(sdk, fileArrayBuffer);
  return pdfDoc;
}

/**
 * Opens a document stored on the user's computer using FileReader object.
 * File objects are generally retrieved from a FileList object returned
 * as a result of a user selecting files using the <input> element.
 * @async @function psOpenFileAsync
 * @param {File} file File object.
 * @returns {Promise<Uint8Array>} Promise object representing Uint8Array of the opened document.
 */
async function psOpenFileAsync(file){
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(new Uint8Array(reader.result));
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  })
}

/**
 * Opens a document server-side using NodeJS fs module.
 * @async @function psOpenFileFs
 * @param {string} file Absolute or relative path to the file.
 * @returns {Promise<Uint8Array>} Promise object representing Uint8Array of the opened document.
 */
async function psOpenFileFs(file) {
  var fs = require('fs');
  var fileArrayBuffer = new Uint8Array( fs.readFileSync(file, null).buffer );
  return fileArrayBuffer;
}

/**
 * Opens a document from URL
 * @async @function psMakeXhrRequest
 * @param {string} method POST | GET.
 * @param {string} url URL to the file.
 * @returns {Promise<Uint8Array>} Promise object representing Uint8Array of the opened document.
 */
async function psMakeXhrRequest(method, url) {
  return new Promise(function (resolve, reject) {
    let xhr = new XMLHttpRequest();
    xhr.open(method, url, true);
    xhr.responseType = "arraybuffer";
    xhr.onload = function () {
      if (this.status >= 200 && this.status < 300) {
        resolve(new Uint8Array(xhr.response));
      } else {
        reject({
          status: this.status,
          statusText: xhr.statusText
        });
      }
    };
    xhr.onerror = function () {
      reject({
        status: this.status,
        statusText: xhr.statusText
      });
    };
    xhr.send();
  });
}

/**
 * Opens the specified document from memory.
 * @async @function pdfixOpenDocFromStream
 * @param {Object} sdk WASM instance of the PDFix SDK.
 * @param {Uint8Array} fileArrayBuffer Uint8Array of the opened document.
 * @returns {Promise<Object>} Promise object representing Uint8Array of the opened document.
 */
async function pdfixOpenDocFromStream(sdk, fileArrayBuffer) {
  var pdfix = sdk.GetPdfix();
  var memStream = pdfix.CreateMemStream();
  const [buffer, size] = sdk.allocArray(fileArrayBuffer);
  memStream.Write(0, buffer, size);
  var pdfDoc = pdfix.OpenDocFromStream(memStream, "");
  return pdfDoc;
}

/**
 * CommonJS export format.
 * @module pdfOpenDoc
 * @exports pdfOpenDoc
 */
module.exports.pdfOpenDoc = pdfOpenDoc;