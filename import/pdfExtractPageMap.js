/**
 * @copyright 2021 Pdfix. All Rights Reserved.
 * 
 * @fileoverview Extracts particular document page map data.
 * @see https://github.com/pdfix/pdfix_sdk_example_cpp/blob/master/src/ExtractPageMap.cpp
 */

/**
 * @class ExtractPageMap
 */
class ExtractPageMap {

  /**
   * @param {Object} sdk Wasm instance of PDFix SDK.
   * @param {Object} pdfDoc Wasm instance of opened PDF document.
   * @param {number} pageNumber Document page number to be processed (zero-based).
   */
  constructor(sdk, pdfDoc, pageNumber) {
    this.sdk = sdk;
    this.pdfDoc = pdfDoc;
    this.pageNumber = pageNumber;
    this.pageMap = null;
  }

  // ToDo: JSDoc
  getElementTypeString(pdeElement) {
    switch( pdeElement.GetType() ) {
      case(0):  return "unknown";         // kPdeUnknown - Unknown element.
      case(1):  return "pde_text";        // kPdeText - PdeText element.
      case(2):  return "pde_text_line";   // kPdeTextLine - PdeTextLine element.
      case(3):  return "pde_word";        // kPdeWord - PdeWord element.
      case(4):  return "pde_text_run";    // kPdeTextRun - PdeTextRun element. Not exported yet.
      case(5):  return "pde_image";       // kPdeImage - PdeImage element.
      case(6):  return "pde_container";   // kPdeContainer - PdeContainer element.
      case(7):  return "pde_list";        // kPdeList - PdeList element.
      case(8):  return "pde_line";        // kPdeLine - PdeLine element.
      case(9):  return "pde_rect";        // kPdeRect - PdeRect element.
      case(10): return "pde_table";       // kPdeTable - PdeTable element.
      case(11): return "pde_cell";        // kPdeCell - PdeCell element.
      case(12): return "pde_toc";         // kPdeToc - PdeToc element.
      case(13): return "pde_form_field";  // kPdeFormField - PdeFormField element.
      case(14): return "pde_header";      // kPdeHeader - PdeHeader element.
      case(15): return "pde_footer";      // kPdeFooter - PdeFooter element.
      case(16): return "pde_annot";       // kPdeAnnot - PdeAnnot element.
    }
  }

  /**
   * Gets a bbox of a given page element.
   * @method getElementBbox
   * @param {Object} pdeElement
   * @returns {Object}
   */
  getElementBbox(pdeElement) {
    let pdfRect = new this.sdk.PdfRect();
    pdeElement.GetBBox(pdfRect);
    let bbox = {
      top: pdfRect.top,
      left: pdfRect.left,
      bottom: pdfRect.bottom,
      right: pdfRect.right
    };
    return bbox;
  }

  /**
   * Extracts text element.
   * @method extractTextElement
   * @param {Object} pdeText
   * @returns {Object}
   */
  extractTextElement(pdeText) {
    let node = [];
    let parentIndexNumber = 0;
    for ( let line = 0; line < pdeText.GetNumTextLines(); line++ ) {
      let pdeTextLine = this.sdk.castObject(pdeText.GetTextLine(line), this.sdk.PdeTextLine);
      let textLine = {
        id: pdeTextLine.GetId(),
        parentId: pdeText.GetId(),
        lineNum: line,
        numWords: pdeTextLine.GetNumWords(),
        type: this.getElementTypeString(pdeTextLine),
        text: pdeTextLine.GetText(),
        bbox: this.getElementBbox(pdeTextLine),
        kids: []
      };
      for ( let word = 0; word < pdeTextLine.GetNumWords(); word++ ) {
        let pdeWord = this.sdk.castObject(pdeTextLine.GetWord(word), this.sdk.PdeWord);
        let child = {
          id: pdeWord.GetId(),
          parentId: pdeTextLine.GetId(),
          index: word,
          parentIndex: parentIndexNumber,
          type: this.getElementTypeString(pdeWord),
          text: pdeWord.GetText(),
          bbox: this.getElementBbox(pdeWord)
        };
        textLine.kids.push(child);
        parentIndexNumber++;
      }
      node.push(textLine)
    }
    return node;
  }

  /**
   * Extracts the page element.
   * @method extractPageElement
   * @param {Object} pdeElement
   * @returns {Object}
   */
  extractPageElement(pdeElement) {
    if ( !pdeElement ) {
      pdeElement = this.pageMap.GetElement();
      if ( !pdeElement ) {
        return null;
      }
    }

    let node = {};
    let elementTypeString = this.getElementTypeString(pdeElement);
    let elementBbox = this.getElementBbox(pdeElement);

    switch(elementTypeString) {
      case("pde_text"): {
        let pdeText = this.sdk.castObject(pdeElement, this.sdk.PdeText);
        let pdeTextKids = this.extractTextElement(pdeText);
        node = {
          id: pdeText.GetId(),
          numWords: pdeText.GetNumWords(),
          numLines: pdeText.GetNumTextLines(),
          type: elementTypeString,
          bbox: elementBbox,
          text: pdeText.GetText()
        };
        if ( pdeTextKids.length ) {
          node["kids"] = pdeTextKids;
        }
        break;
      }
      default: {
        node = {
          id: pdeElement.GetId(),
          type: elementTypeString,
          bbox: elementBbox
        };
        break;
      };
    }

    let numChildren = pdeElement.GetNumChildren();
    if ( numChildren > 0 ) {
      node["kids"] = [];
      for ( let i = 0; i < numChildren; i++ ) {
        node["kids"].push( this.extractPageElement( pdeElement.GetChild(i) ) );
      }
    }

    return node;
  }

  /**
   * Extracts the page map of a given page.
   * @method extract
   * @returns {Object}
   */
  extract() {
    let pdfPage = this.pdfDoc.AcquirePage(this.pageNumber);
    let pMap = pdfPage.AcquirePageMap();
    if ( !pMap ) {
      return null;
    }
    this.pageMap = pMap;
    let output = this.extractPageElement();
    pdfPage.Release();
    return output;
  }

}

/**
 * Extracts particular document page map data.
 * @async @function pdfGetPageContent
 * @param {Object} sdk Wasm instance of the PDFix SDK.
 * @param {Object} pdfDoc Wasm instance of the document.
 * @returns {Object}
 */
async function pdfExtractPageMap(sdk, pdfDoc, data) {
  let pageNumber = data.pageNumber - 1;
  let pageMap = new ExtractPageMap(sdk, pdfDoc, pageNumber);
  let output = {
    pageNumber: pageNumber+1,
    data: pageMap.extract()
  };
  return output;
}

/**
 * CommonJS export format.
 * @module pdfExtractPageMap
 * @exports pdfExtractPageMap
 */
module.exports.pdfExtractPageMap = pdfExtractPageMap;