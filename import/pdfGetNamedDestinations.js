/**
 * @copyright 2021 Pdfix. All Rights Reserved.
 * 
 * @fileoverview Extracts document named destinations.
 * @see https://github.com/pdfix/pdfix_sdk_example_cpp/blob/master/src/NamedDestsToJson.cpp
 */

/**
 * @class ExtractNamedDestinations
 */
class ExtractNamedDestinations {

  /**
   * @param {Object} sdk Wasm instance of PDFix SDK.
   * @param {Object} pdfDoc Wasm instance of opened PDF document.
   */
  constructor(sdk, pdfDoc) {
    this.sdk = sdk;
    this.pdfDoc = pdfDoc;
  }

  /**
   * Processes particular nameTree object.
   * @method processNameTreeObject
   * @param {Object} obj PdfViewDestination.
   * @param {Object} namedDestsNode Named destination node.
   * @returns {Object}
   */
  processNameTreeObject(obj, namedDestsNode) {
    if ( !obj ) {
      return;
    }
    let objectType = obj.GetObjectType();
    if ( objectType == 6 ) { // kPdsDictionary
      let namesDict = this.sdk.castObject(obj, this.sdk.PdsDictionary); 
      let names = namesDict.GetArray("Names");
      let kids = namesDict.GetArray("Kids");
      if ( names.ptr != 0 ) {
        let namesCount = names.GetNumObjects();
        for ( let i = 0; i < namesCount; i+=2 ) {
          let viewDest = this.pdfDoc.GetViewDestinationFromObject(names.Get(i+1));
          let pageNum = viewDest.GetPageNum(this.pdfDoc);
          // process only valid named destinations pointing to existing pages
          if ( viewDest.ptr != 0 && pageNum != -1 ) {
            let nameText = this.sdk.castObject(names.Get(i), this.sdk.PdsString);
            let text = nameText.GetText();
            namedDestsNode[text] = {
              "page_num": pageNum + 1
            };
          }
        }
      }
      if ( kids.ptr != 0 ) {
        let kidsCount = kids.GetNumObjects();
        for ( let i = 0; i < kidsCount; i++ ) {
          let kidsDict = kids.GetDictionary(i);
          this.processNameTreeObject(kidsDict, namedDestsNode);
        }
      }
    }
    return namedDestsNode;
  }

  /**
   * Extracts the named destinations.
   * @method extract
   * @returns {Object}
   */
  extract() {
    let output = {};
    let namedDestsNode = {};
    let namedDestsParent = this.pdfDoc.GetNameTree("Dests", false);
    if ( namedDestsParent.ptr != 0 ) {
      let namedDestsTree = namedDestsParent.GetObject();
      output = this.processNameTreeObject(namedDestsTree, namedDestsNode);
    }
    return output;
  }

}

/**
 * Gets document named destinations.
 * @async @function pdfGetNamedDestinations
 * @param {Object} sdk Wasm instance of the PDFix SDK.
 * @param {Object} pdfDoc Wasm instance of the document.
 * @returns {Object}
 */
async function pdfGetNamedDestinations(sdk, pdfDoc) {
  let namedDestinations = new ExtractNamedDestinations(sdk, pdfDoc);
  let output = namedDestinations.extract();
  return output;
}

/**
 * CommonJS export format.
 * @module pdfGetNamedDestinations
 * @exports pdfGetNamedDestinations
 */
module.exports.pdfGetNamedDestinations = pdfGetNamedDestinations;