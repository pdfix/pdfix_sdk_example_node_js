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
 * pdfExtractPageMap module.
 * @const {module} pdfExtractPageMap
 */
const { pdfExtractPageMap } = require(config.pdfixModulesPath + 'pdfExtractPageMap.js');
/**
 * pdfGetBookmarks module.
 * @const {module} pdfGetBookmarks
 */
const { pdfGetBookmarks } = require(config.pdfixModulesPath + 'pdfGetBookmarks.js');
/**
 * pdfGetNamedDestinations module.
 * @const {module} pdfGetNamedDestinations
 */
const { pdfGetNamedDestinations } = require(config.pdfixModulesPath + 'pdfGetNamedDestinations.js');
/**
 * pdfGetPageAnnots module.
 * @const {module} pdfGetPageAnnots
 */
const { pdfGetPageAnnots } = require(config.pdfixModulesPath + 'pdfGetPageAnnots.js');
/**
 * pdfGetPageContent module.
 * @const {module} pdfGetPageContent
 */
const { pdfGetPageContent } = require(config.pdfixModulesPath + 'pdfGetPageContent.js');
/**
 * pdfRedact module.
 * @const {module} pdfRedact
 */
const { pdfRedact } = require(config.pdfixModulesPath + 'pdfRedact.js');

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
  pdfOpenDoc( PDFIX_SDK, openDocData ).then((pdfDoc) => {
    console.log("\nSample PDF document opened...");

    console.log("\nGetting page properties...");
    pdfGetPageProperties(PDFIX_SDK, pdfDoc).then((pageProperties) => {
      console.log(pageProperties);

      console.log("\nPage render sample...");
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
      console.log("\nSample render parameters:");
      console.log(sampleRenderParams);
      pdfRenderPage(PDFIX_SDK, pdfDoc, sampleRenderParams).then((base64) => {
        console.log("Page render sample response data:");
        console.log(base64);

        console.log("\nExtracting page map... (page 1)");
        pdfExtractPageMap( PDFIX_SDK, pdfDoc, {pageNumber: 1} ).then((pageMap) => {
          console.log(pageMap);

          console.log("\nGetting document bookmarks...");
          pdfGetBookmarks( PDFIX_SDK, pdfDoc ).then((docBookmarks) => {
            console.log(docBookmarks);

            console.log("\nGetting document named destinations...");
            pdfGetNamedDestinations( PDFIX_SDK, pdfDoc ).then((namedDestinations) => {
              console.log(namedDestinations);

              console.log("\nGetting page annotations... (page 1)");
              let requestData = {
                pageNumber: 1,
                annotSubtypes: ['Widget', 'Link', 'Redact']
              };
              pdfGetPageAnnots( PDFIX_SDK, pdfDoc, requestData ).then((pageAnnots) => {
                console.log(pageAnnots);

                console.log("\nGetting page content... (page 1)");
                pdfGetPageContent(PDFIX_SDK, pdfDoc, 1).then((pageContent) => {
                  console.log(pageContent);

                  console.log("\nCreating and applying sample redaction...");
                  let sampleRedactQuery = {
                    query: 'createRedactionMarks',
                    selection: [{
                      pageNumber: 1,
                      kids: [{
                        type: 'rect',
                        fill: 'rgba(0, 0, 0, 1)',
                        height: 71,
                        left: 31,
                        stroke: '#000000',
                        strokeWidth: 1,
                        top: 31,
                        width: 151,
                        data: {
                          overlayText: 'TEXT',
                          overlayTextAlignment: 'left',
                          overlayTextFont: 'Helvetica',
                          overlayTextFontColor: '#000000',
                          overlayTextFontSize: 10,
                          redactedAreaFillColor: '#000000',
                          redactionMarkFillColor: '#000000',
                          redactionMarkFillOpacity: 100,
                          redactionMarkOutlineColor: '#000000',
                          repeatOverlayText: false,
                          useOverlayText: true
                        }
                      }]
                    }]
                  };
                  pdfRedact( PDFIX_SDK, pdfDoc, sampleRedactQuery ).then((data) => {
                    console.log(data);
                    let applyRedactionRequest = {
                      query: 'applyRedaction'
                    };
                    pdfRedact( PDFIX_SDK, pdfDoc, applyRedactionRequest ).then((data) => {
                      console.log(data);
                    });
                  });

                });
              });
            });
          });
        });

      });

    });
  });

}