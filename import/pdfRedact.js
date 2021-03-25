/**
 * @copyright 2021 Pdfix. All Rights Reserved.
 * 
 * @fileoverview Creates and applies redaction mark(s) in a document.
 * @see https://github.com/pdfix/pdfix_sdk_example_cpp/blob/master/src/CreateRedactionMark.cpp
 * @see https://github.com/pdfix/pdfix_sdk_example_cpp/blob/master/src/ApplyRedaction.cpp
 */

/**
 * @class Redact
 */
class Redact {

  /**
   * @param {Object} sdk Wasm instance of PDFix SDK.
   * @param {Object} pdfDoc Wasm instance of opened PDF document.
   * @param {number} data Redaction request related data.
   */
  constructor(sdk, pdfDoc, data) {
    this.sdk = sdk;
    this.pdfDoc = pdfDoc;
    this.data = data;
  }

  /**
   * Converts HEX color value to RGB.
   * @method hexToRgb
   * @param {string} hex
   * @returns {Array<number>}
   */
  hexToRgb(hex) {
    return hex.replace(/^#?([a-f\d])([a-f\d])([a-f\d])$/i ,(m, r, g, b) => '#' + r + r + g + g + b + b)
      .substring(1).match(/.{2}/g)
      .map(x => parseInt(x, 16));
  }

  /**
   * Gets the index representation of overlay text alignment.
   * @method getOverlayTextAlignment
   * @param {string} align
   * @returns {number}
   */
  getOverlayTextAlignment(align) {
    switch(align) {
      case("left"): {
        return 0;
      }
      case("center"): {
        return 1;
      }
      case("right"): {
        return 2;
      }
    }
  }

  /**
   * Applies the redaction for the whole document.
   * @method applyRedaction
   * @returns {boolean}
   */
  applyRedaction() {
    let redactionResult = this.pdfDoc.ApplyRedaction();
    if ( redactionResult ) {
      let pdfix = this.sdk.GetPdfix();
      var stream = pdfix.CreateMemStream();
      this.pdfDoc.SaveToStream(stream);
    }
    return redactionResult;
  }

  /**
   * Creates redaction mark and saves it to the new document.
   * @method createRedactionMarks
   * @returns {boolean}
   */
  createRedactionMarks() {
    try {
      let selection = this.data.selection;

      if ( selection ) {
        for ( let pageSelection of selection ) {
          let pageNum = pageSelection.pageNumber - 1;
          let pageSelKids = pageSelection.kids;

          let docPage = this.pdfDoc.AcquirePage(pageNum);
          let pageView = docPage.AcquirePageView(1, 0);

          for ( let selKid of pageSelKids ) {
            if ( selKid.name ) {
              continue;
            } 

            let deviceBbox = {
              left: selKid.left,
              top: selKid.top,
              right: selKid.left + selKid.width,
              bottom: selKid.top + selKid.height
            };

            let devRect = new this.sdk.PdfDevRect();
            devRect.left = deviceBbox.left;
            devRect.top = deviceBbox.top;
            devRect.right = deviceBbox.right;
            devRect.bottom = deviceBbox.bottom;
          
            let pdfRect = new this.sdk.PdfRect();
            pageView.RectToPage(devRect, pdfRect);

            // Create empty redact annotation and add it to the page
            let redactAnnot = docPage.AddNewAnnot(-1, pdfRect, 26); // 'kAnnotRedact'

            // Notify before editing
            redactAnnot.NotifyWillChange("IC");
            let redactDict = redactAnnot.GetObject();

            // Normal appearance
            // Outline color
            let annotationOutlineColor = redactDict.PutArray("OC");
            let ocArray = this.hexToRgb(selKid.data.redactionMarkOutlineColor);
            annotationOutlineColor.PutNumber(0, ocArray[0]/255);
            annotationOutlineColor.PutNumber(1, ocArray[1]/255);
            annotationOutlineColor.PutNumber(2, ocArray[2]/255);

            // Normal appearance
            // Fill color
            let annotationFillColor = redactDict.PutArray("AFC");
            let afcArray = this.hexToRgb(selKid.data.redactionMarkFillColor);
            annotationFillColor.PutNumber(0, afcArray[0]/255);
            annotationFillColor.PutNumber(1, afcArray[1]/255);
            annotationFillColor.PutNumber(2, afcArray[2]/255);
            
            // https://chromium-coverage.appspot.com/reports/563143/linux/chromium/src/third_party/pdfium/fpdfsdk/fpdf_annot.cpp.html
            //annotationFillColor.PutNumber("ca", 1);
            //redactDict.PutNumber("CA", 0.5);

            // Redaction overlay appearance
            // Inner color
            let innerColor = redactDict.PutArray("IC");
            let icArray = this.hexToRgb(selKid.data.redactedAreaFillColor);
            innerColor.PutNumber(0, icArray[0]/255);
            innerColor.PutNumber(1, icArray[1]/255);
            innerColor.PutNumber(2, icArray[2]/255);

            // Font style
            if ( selKid.data.overlayText.length > 0 ) {
              let daColor = this.hexToRgb(selKid.data.overlayTextFontColor);
              let daRGcolorString = daColor[0]/255 + " " + daColor[1]/255 + " " + daColor[2]/255 + " RG";
              let dargcolorString = daColor[0]/255 + " " + daColor[1]/255 + " " + daColor[2]/255 + " rg";
              let fontSize = selKid.data.overlayTextFontSize;

              redactDict.PutString("DA", daRGcolorString + " " + dargcolorString +
                " 0 Tc 0 Tw 100 Tz 0 TL 0 Ts 0 Tr /Helv " + fontSize + " Tf");
              redactDict.PutString("OverlayText", selKid.data.overlayText);
              redactDict.PutNumber("Q", this.getOverlayTextAlignment(selKid.data.overlayTextAlignment) );

              if ( selKid.data.repeatOverlayText ) {
                redactDict.PutBool("Repeat", true);
              }
            }

            // Notify after editing - this will regenerate redaction appearance from given settings
            redactAnnot.NotifyDidChange("IC", 0);
          }
          docPage.Release();
          pageView.Release();
        }
      }

    }
    catch(e) {
      console.error(e);
      return false;
    }
    return true;
  }

  /**
   * Updates particular redaction mark that already exists in the document.
   * @method updateRedactionMark
   * @returns {boolean}
   */
  updateRedactionMark() {
    let selection = this.data.selection;
    try {
      if ( selection ) {
        for ( let pageSelection of selection ) {
          let pageNum = pageSelection.pageNumber - 1;
          let pageSelKids = pageSelection.kids;
          let docPage = this.pdfDoc.AcquirePage(pageNum);
      
          for ( let selKid of pageSelKids ) {
            if ( selKid.name ) {
              
              let selectionAnnotId = parseInt(selKid.name);
              let pageNumAnnots = docPage.GetNumAnnots();

              for ( let i = 0; i < pageNumAnnots; i++ ) {
                let redactAnnot = docPage.GetAnnot(i);
                if ( !redactAnnot ) {
                  continue;
                }
                let redactDict = redactAnnot.GetObject();
                let subType = redactDict.GetText("Subtype");
                if ( subType == "Redact" ) {
                  let pageAnnotId = redactDict.GetId();

                  if ( selectionAnnotId == pageAnnotId ) {
                    redactAnnot.NotifyWillChange("IC");

                    let annotationOutlineColor = redactDict.GetArray("OC");
                    let ocArray = this.hexToRgb(selKid.data.redactionMarkOutlineColor);
                    annotationOutlineColor.PutNumber(0, ocArray[0]/255);
                    annotationOutlineColor.PutNumber(1, ocArray[1]/255);
                    annotationOutlineColor.PutNumber(2, ocArray[2]/255);

                    let annotationFillColor = redactDict.GetArray("AFC");
                    let afcArray = this.hexToRgb(selKid.data.redactionMarkFillColor);
                    annotationFillColor.PutNumber(0, afcArray[0]/255);
                    annotationFillColor.PutNumber(1, afcArray[1]/255);
                    annotationFillColor.PutNumber(2, afcArray[2]/255);

                    let innerColor = redactDict.GetArray("IC");
                    let icArray = this.hexToRgb(selKid.data.redactedAreaFillColor);
                    innerColor.PutNumber(0, icArray[0]/255);
                    innerColor.PutNumber(1, icArray[1]/255);
                    innerColor.PutNumber(2, icArray[2]/255);

                    if ( selKid.data.useOverlayText ) {
                      if ( selKid.data.overlayText.length > 0 ) {
                        let daColor = this.hexToRgb(selKid.data.overlayTextFontColor);
                        let daRGcolorString = daColor[0]/255 + " " + daColor[1]/255 + " " + daColor[2]/255 + " RG";
                        let dargcolorString = daColor[0]/255 + " " + daColor[1]/255 + " " + daColor[2]/255 + " rg";
                        let fontSize = selKid.data.overlayTextFontSize;

                        redactDict.PutString("DA", daRGcolorString + " " + dargcolorString +
                          " 0 Tc 0 Tw 100 Tz 0 TL 0 Ts 0 Tr /Helv " + fontSize + " Tf");
                        redactDict.PutString("OverlayText", selKid.data.overlayText);
                        redactDict.PutNumber("Q", this.getOverlayTextAlignment(selKid.data.overlayTextAlignment) );

                        if ( selKid.data.repeatOverlayText ) {
                          redactDict.PutBoolean("Repeat", true);
                        }
                      }
                      else {
                        redactDict.PutString("OverlayText", "");
                      }
                    }
                    else {
                      redactDict.PutString("OverlayText", "");
                    }

                    redactAnnot.NotifyDidChange("IC", 0);
                  }
                }
              }
            }
          }
          docPage.Release();
        }
      }
    }
    catch(e) {
      console.error(e);
      return false;
    }
    return true;
  }

  /**
   * Removes redaction marks from the document.
   * @method removeRedactionMarks
   * @returns {boolean}
   */
  removeRedactionMarks() {
    try {
      let pageNum = this.data.pageNumber - 1;
      let docPage = this.pdfDoc.AcquirePage(pageNum);
      for ( let annotIndex of this.data.indexes ) {
        for ( let i = 0; i < docPage.GetNumAnnots(); i++ ) {
          let annot = docPage.GetAnnot(i);
          if ( annot.GetSubtype() == 26 ) { // 'kAnnotRedact'
            let annotObj = annot.GetObject();
            let annotObjId = annotObj.GetId();
            if ( annotIndex == annotObjId ) {
              docPage.RemoveAnnot(i);
            }
          }
        }
      }
    }
    catch(e) {
      console.error(e);
      return false;
    }
    return true;
  }

}

/**
 * Creates and applies redaction mark(s) in a document.
 * @async @function pdfRedact
 * @param {Object} sdk Wasm instance of the PDFix SDK.
 * @param {Object} pdfDoc Wasm instance of the document.
 * @param {Object} data The redaction mark(s) data.
 * @returns {Object}
 */
async function pdfRedact(sdk, pdfDoc, data) {

  let output;
  let redact = new Redact(sdk, pdfDoc, data);

  switch(data.query) {
    case('createRedactionMarks'): {
      output = {
        query: data.query,
        result: redact.createRedactionMarks()
      };
      break;
    }
    case('updateRedactionMark'): {
      output = {
        query: data.query,
        result: redact.updateRedactionMark()
      };
      break;
    }
    case('removeRedactionMarks'): {
      output = {
        query: data.query,
        result: redact.removeRedactionMarks()
      };
      break;
    }
    case('applyRedaction'): {
      output = {
        query: data.query,
        result: redact.applyRedaction()
      };
      break;
    }
  }

  return output;
  
}

/**
 * CommonJS export format.
 * @module pdfRedact
 * @exports pdfRedact
 */
module.exports.pdfRedact = pdfRedact;