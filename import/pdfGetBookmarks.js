/**
 * @copyright 2021 Pdfix. All Rights Reserved.
 * 
 * @fileoverview Extracts document bookmarks.
 * @see https://github.com/pdfix/pdfix_sdk_example_cpp/blob/master/src/BookmarksToJson.cpp
 */

/**
 * @class ExtractBookmarks
 */
class ExtractBookmarks {

  /**
   * @param {Object} sdk Wasm instance of PDFix SDK.
   * @param {Object} pdfDoc Wasm instance of opened PDF document.
   */
  constructor(sdk, pdfDoc) {
    this.sdk = sdk;
    this.pdfDoc = pdfDoc;
  }

  /**
   * Processes particular bookmark node.
   * @method processBookmark
   * @param {Object} bmk PdfBookmark.
   * @param {Object} bmkNode Bookmark node.
   * @returns {Object}
   */
  processBookmark(bmk, bmkNode) {
    let node = {};
    try {
      if ( bmk.GetParent().ptr != 0 ) {
        let title = bmk.GetTitle();
        let action = bmk.GetAction();
        node["title"] = title;
        if ( action.ptr != 0 ) {
          switch ( action.GetSubtype() ) {
            case(1): { // kActionGoTo
              let viewDest = action.GetViewDestination();
              if ( viewDest.ptr != 0 ) {
                let viewDestPageNum = viewDest.GetPageNum(this.pdfDoc) + 1;
                node["action"] = {
                  type: "GoTo",
                  page_num: viewDestPageNum
                };
              }
              break;
            }
            case(6): { // kActionURI 
              let uriString = action.GetDestFile();
              node["action"] = {
                type: "URI",
                uri: uriString
              };
              break;
            }
          }
        }
        bmkNode["kids"].push(node);
      }
      else {
        bmkNode = node;
      }
    }
    catch(e) {
      console.warn("bmk.GetParent() failed: " + e);
    }

    let childrenCount = bmk.GetNumChildren();
    if ( childrenCount > 0 ) { 
      node["kids"] = [];
      for ( let i = 0; i < childrenCount; i++ ) {
        let child = bmk.GetChild(i);
        this.processBookmark( child, node );
      }
    }
  
    return bmkNode;
  }

  /**
   * Extracts the bookmarks.
   * @method extract
   * @returns {Object}
   */
  extract() {
    let output = {};
    let bmkRootNode = {};
    let bookmarksParent = this.pdfDoc.GetBookmarkRoot();
    if ( bookmarksParent ) {
      bmkRootNode["kids"] = [];
      output = this.processBookmark(bookmarksParent, bmkRootNode);
    }
    return output;
  }

}

/**
 * Gets document bookmarks.
 * @async @function pdfGetBookmarks
 * @param {Object} sdk Wasm instance of the PDFix SDK.
 * @param {Object} pdfDoc Wasm instance of the document.
 * @returns {Object}
 */
async function pdfGetBookmarks(sdk, pdfDoc) {
  let bookmarks = new ExtractBookmarks(sdk, pdfDoc);
  let output = bookmarks.extract();
  return output;
}

/**
 * CommonJS export format.
 * @module pdfGetBookmarks
 * @exports pdfGetBookmarks
 */
module.exports.pdfGetBookmarks = pdfGetBookmarks;