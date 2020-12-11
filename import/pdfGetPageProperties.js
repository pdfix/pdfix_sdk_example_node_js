/**
 * @copyright 2020 Pdfix. All Rights Reserved.
 * 
 * @fileoverview Contains and exports function pdfGetPageProperties.
 * @see {pdfGetPageProperties}
 * 
 * @typedef {Object} pageProperties
 * @property {number} width Right cropBox of the page.
 * @property {number} height Top cropBox of the page.
 * @property {number} rotation Rotation of the page.
 */

/**
 * Gets the number of pages in a document, iterates over each PdfPage from a document getting
 * pdfPage CropBox which determines the PageProperties.
 * @async @function pdfGetPageProperties
 * @param {Object} sdk WASM instance of the PDFix SDK.
 * @param {Object} pdfDoc WASM instance of the document.
 * @returns {Promise<pageProperties>} Promise object representing pageProperties
 */
async function pdfGetPageProperties(sdk, pdfDoc) {
  
  let pageProperties = {};
  var pdfPages = pdfDoc.GetNumPages();

  for ( let i = 0; i < pdfPages; i++ ) {
    let pdfPage = pdfDoc.AcquirePage(i);
    let pageRotation = pdfPage.GetRotate();
    let cropBox = new sdk.PdfRect();
    let pageNumber = i+1;
    pdfPage.GetCropBox(cropBox);
    pageProperties[pageNumber] = {
      width: cropBox.right,
      height: cropBox.top,
      rotation: pageRotation
    };
  }

  return pageProperties;
}

/**
 * CommonJS export format.
 * @module pdfGetPageProperties
 * @exports pdfGetPageProperties
 */
module.exports.pdfGetPageProperties = pdfGetPageProperties;