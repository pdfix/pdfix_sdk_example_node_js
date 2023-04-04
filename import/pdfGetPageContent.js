/**
 * @copyright 2020 Pdfix. All Rights Reserved.
 * 
 * @fileoverview Gets particular document page content data.
 * @see https://github.com/pdfix/pdfix_sdk_example_cpp/blob/master/src/ExtractPageContent.cpp
 * @see https://github.com/pdfix/pdfix_sdk_example_cpp/blob/master/src/ParsePageContent.cpp
 */

/**
 * @class PdfExtractPageContent
 */
class PdfExtractPageContent {

  /**
   * @param {Object} sdk Wasm instance of PDFix SDK.
   * @param {Object} pdfDoc Wasm instance of opened PDF document.
   * @param {number} pageNumber Document page number to be processed (zero-based).
   */
  constructor(sdk, pdfDoc, pageNumber) {
    this.sdk = sdk;
    this.pdfDoc = pdfDoc;
    this.pageNumber = pageNumber;
  }

  /**
   * Gets the string type of an object.
   * @method getObjectTypeString
   * @param {Object} pdsPageObject A PdsPageObject is a general object in a PDF page content,
   * which may be of any PdsPageObject object type. The Object layer provides several methods
   * that are not specific to any particular object.
   * @returns {string}
   */
  getObjectTypeString(pdsPageObject) {
    switch( pdsPageObject.GetObjectType() ) {
      case(0): return "unknown";      // kPdsPageUnknown - Unknown object.
      case(1): return "pds_text";     // kPdsPageText - Text object.
      case(2): return "pds_path";     // kPdsPagePath - Path object.
      case(3): return "pds_image";    // kPdsPageImage - Image object.
      case(4): return "pds_shading";  // kPdsPageShading - Shading object.
      case(5): return "pds_form";     // kPdsPageForm - Form object.
    }
  }
  
  /**
   * Extracts the particular page object.
   * @method extractPageObject
   * @param {Object} pdsPageObject A PdsPageObject is a general object in a PDF page content,
   * which may be of any PdsPageObject object type. The Object layer provides several methods
   * that are not specific to any particular object.
   * @returns {Object}
   */
  extractPageObject(pdsPageObject) {
    let objectTypeString = this.getObjectTypeString(pdsPageObject);
  
    let node = {};
  
    if (
      objectTypeString == "pds_text" |
      objectTypeString == "pds_image" |
      objectTypeString == "pds_form"
    ) {
  
      node["type"] = objectTypeString;
      
      if ( objectTypeString == "pds_text" ) {
        let pdsText = this.sdk.castObject(pdsPageObject, this.sdk.PdsText);
        let text = pdsText.GetText();
        let bbox = new this.sdk.PdfRect();
        pdsPageObject.GetBBox(bbox);
        
        let textState = new this.sdk.PdfTextState();
        pdsText.GetTextState( textState );
  
        node["text"] = text;
        node["bbox"] = {
          top: bbox.top,
          left: bbox.left,
          bottom: bbox.bottom,
          right: bbox.right
        };
        node["textState"] = {
          fontSize: textState.font_size,
          charSpacing: textState.char_spacing,
          wordSpacing: textState.word_spacing,
        };
        if (textState.font.ptr) {
          node["textState"] = {
            fontName: textState.font.GetFontName(),
            sysFontName: textState.font.GetSystemFontName(),
            isBold: textState.font.GetSystemFontBold(),
            isItalic: textState.font.GetSystemFontItalic(),
          };
        }
      }
      
      if ( objectTypeString == "pds_image" ) {
        let pdsImage = this.sdk.castObject(pdsPageObject, this.sdk.PdsImage);
        let bbox = new this.sdk.PdfRect();
        pdsImage.GetBBox(bbox);
  
        node["bbox"] = {
          top: bbox.top,
          left: bbox.left,
          bottom: bbox.bottom,
          right: bbox.right
        };
      }
  
      /*
      if ( objectTypeString == "pds_form" ) {
        console.log("pds_form", pdsPageObject);
      }
      */
  
      return node;
  
    }
    else {
      return null;
    }
  }

  /**
   * Extracts the page objects of a given page.
   * @method extract
   * @returns {Object}
   */
  extract() {
    let pdfPage = this.pdfDoc.AcquirePage(this.pageNumber);
    let pageContent = pdfPage.GetContent();
    let output = [];
    let pageObjectsCount = pageContent.GetNumObjects();
    for ( let i = 0; i < pageObjectsCount; i++ ) {
      let pdsPageObject = pageContent.GetObject(i);
      let extractedPageObject = this.extractPageObject(pdsPageObject);
      if ( extractedPageObject ) {
        output.push(extractedPageObject);
      }
    }
    pdfPage.Release();
    return output;
  }

}

/**
 * Gets the particular document page content data.
 * @async @function pdfGetPageContent
 * @param {Object} sdk Wasm instance of the PDFix SDK.
 * @param {Object} pdfDoc Wasm instance of the document.
 * @returns {Object}
 */
async function pdfGetPageContent(sdk, pdfDoc, pageNumber) {
  pageNumber -= 1;
  let content = new PdfExtractPageContent(sdk, pdfDoc, pageNumber);
  let output = {
    pageNumber: pageNumber+1,
    data: content.extract()
  };
  return output;
}

/**
 * CommonJS export format.
 * @module pdfGetPageContent
 * @exports pdfGetPageContent
 */
module.exports.pdfGetPageContent = pdfGetPageContent;