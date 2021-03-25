/**
 * @copyright 2020 Pdfix. All Rights Reserved.
 * 
 * @fileoverview Contains and exports function pdfSaveDocAs @see {pdfSaveDocAs}
 * 
 */

/**
 * Saves a document from memory stream into Blob.
 * @async @function pdfSaveDocAs
 * @param {Object} sdk WASM instance of the PDFix SDK.
 * @param {Object} pdfDoc WASM instance of the document.
 * @returns {Promise<Blob>}
 */
async function pdfSaveDocAs(sdk, pdfDoc, serverFilePath) {
  var pdfix = sdk.GetPdfix();
  var accountAuth = pdfix.GetAccountAuthorization();
  accountAuth.Authorize('<---LICENSE EMAIL--->', '<---LICENSE KEY--->');
  var stream = pdfix.CreateMemStream();
  pdfDoc.SaveToStream(stream);
  var arrayBuffer = new ArrayBuffer(stream.GetSize());
  stream.ReadToArrayBuffer(0, arrayBuffer, arrayBuffer.byteLength);
  stream.Destroy();
  if (typeof self === 'undefined') { // neither web window nor web worker
    const fs = require('fs');
    fs.writeFileSync(serverFilePath, new Uint8Array(arrayBuffer));
    return serverFilePath;
  }
  else {
    var blob = new Blob([new Uint8Array(arrayBuffer)], {type: 'application/pdf'});
  }
  return blob;
}

/**
 * CommonJS export format.
 * @module pdfSaveDocAs
 * @exports pdfSaveDocAs
 */
module.exports.pdfSaveDocAs = pdfSaveDocAs;