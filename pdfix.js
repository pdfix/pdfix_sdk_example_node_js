/**
 * @copyright 2020 Pdfix. All Rights Reserved.
 * 
 * @fileoverview Simple Node.js PDFix WASM Sample.
 * 
 * Min Node.js version required: 14.5.1 LTS
 * 
 * Run with --experimental-wasm-threads and --experimental-wasm-bulk-memory flags
 * Eg. node --experimental-wasm-threads --experimental-wasm-bulk-memory pdfix.js
 */

/**
 * Config.
 * @const {Object} config
 */
const config = {
  pdfixWasmPath: './pdfix/pdfix_wasm.js',
  pdfixModulesPath: './import/',
  pdfixWasmSampleFile: './pdf/test.pdf' // or provide a full path to your PDF
};

/**
 * The PDFix WASM module.
 * @const {module} PDFIX_WASM
 */
const PDFIX_WASM = require(config.pdfixWasmPath);
/**
 * pdfOpenDoc module.
 * @const {module} pdfOpenDoc
 */
const { pdfOpenDoc } = require(config.pdfixModulesPath + 'pdfOpenDoc.js');
/**
 * pdfGetPageProperties module.
 * @const {module} pdfGetPageProperties
 */
const { pdfGetPageProperties } = require(config.pdfixModulesPath + 'pdfGetPageProperties.js');
/**
 * pdfRenderPage module.
 * @const {module} pdfRenderPage
 */
const { pdfRenderPage } = require(config.pdfixModulesPath + 'pdfRenderPage.js');

/**
 * WASM instance of the PDFix SDK.
 * @const {module} PDFIX_SDK
 */
var PDFIX_SDK = null;


// Loads the PDFix WASM and calls doSample();
PDFIX_WASM().then(function (wasm) {
  PDFIX_SDK = wasm;
  PDFIX_SDK.GetPdfix = function() {
    return wasm.wrapPointer(wasm._GetPdfix(), wasm.Pdfix);
  }
  PDFIX_SDK.GetPdfToHtml = function() {
    return wasm.wrapPointer(wasm._GetPdfToHtml(), wasm.PdfToHtml);
  }
  PDFIX_SDK.allocArray = function (typedArray) {
    var numBytes = typedArray.length * typedArray.BYTES_PER_ELEMENT;
    var ptr = wasm._malloc(numBytes);
    var heapBytes = new Uint8Array(wasm.HEAPU8.buffer, ptr, numBytes);
    heapBytes.set(new Uint8Array(typedArray.buffer));
    return [heapBytes.byteOffset, typedArray.length];
  };
  PDFIX_SDK.allocString = function(string){
    const bufSize = wasm.lengthBytesUTF32(string);
    var buffer = wasm._malloc(bufSize + 4);
    wasm.stringToUTF32(string, buffer, bufSize + 4);
    return [buffer, string.length];
  }
  doSample();
});

/**
 * Does the sample.
 * Opens the sample PDF document.
 * Gets document page properties as page width, height, rotation.
 * Renders a sample page segment, see sampleRenderParams.
 * @function doSample
 * @returns {void}
 */
function doSample() {
  console.log("PDFix WASM loaded...");

  console.log("Opening the sample PDF document...");
  let openDocData = {
    type: 'psOpenFileFs',
    file: config.pdfixWasmSampleFile
  };
  pdfOpenDoc( PDFIX_SDK, openDocData ).then(function(pdfDoc) {
    console.log("Sample PDF document opened...");

    console.log("Getting page properties...");
    pdfGetPageProperties(PDFIX_SDK, pdfDoc).then(function(data) {
      console.log(data);

      console.log("Page render sample...");
      let sampleRenderParams = {
        segmentId: 0,
        page: 1,
        zoom: 1,
        rotation: 0,
        quality: 80,
        format: 0,
        width: 300,
        height: 300,
        top: 0,
        left: 0
      };
      console.log("Sample render parameters:");
      console.log(sampleRenderParams);
      pdfRenderPage(PDFIX_SDK, pdfDoc, sampleRenderParams).then(function(base64) {
        console.log("Page render sample response data:");
        console.log(base64);
        console.log("Exiting sample...");
        process.exit();
      });
    });
  });

}