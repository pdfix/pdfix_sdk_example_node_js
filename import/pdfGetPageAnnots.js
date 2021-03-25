/**
 * @copyright 2020 Pdfix. All Rights Reserved.
 * 
 * @fileoverview Gets particular document page annotations data.
 * @see https://github.com/pdfix/pdfix_sdk_example_cpp/blob/master/src/ExtractAnnot.cpp
 */

/**
 * @class PdfExtractPageAnnots
 */
class PdfExtractPageAnnots {

  /**
   * @param {Object} sdk Wasm instance of PDFix SDK.
   * @param {Object} pdfDoc Wasm instance of opened PDF document.
   * @param {Object} data The request data.
   */
  constructor(sdk, pdfDoc, data) {
    this.sdk = sdk;
    this.pdfDoc = pdfDoc;
    this.data = data;
  }

  /**
   * Gets the string representation type of a field.
   * @method getFormFieldTypeString
   * @param {Object} fieldType The form field type.
   * @returns {string}
   */
  getFormFieldTypeString(fieldType) {
    switch( fieldType ) {
      case(0): return "unknown";      // kFieldUnknown - Unknown field.
      case(1): return "button";       // kFieldButton - Button.
      case(2): return "radio";        // kFieldRadio - Radio button.
      case(3): return "checkbox";     // kFieldCheck - Check box.
      case(4): return "text";         // kFieldText - Text field.
      case(5): return "dropdown";     // kFieldCombo - Combo box.
      case(6): return "list";         // kFieldList - List.
      case(7): return "signature";    // kFieldSignature - Signature.
    }
  }

  /**
   * Extracts particular widget annot.
   * @method extractWidgetAnnot
   * @param {Object} annot Annotation object.
   * @returns {Object}
   */
  extractWidgetAnnot(annot) {
    let node = {};
    let pdfWidgetAnnot = this.sdk.castObject(annot, this.sdk.PdfWidgetAnnot);
    let formField = pdfWidgetAnnot.GetFormField();
    if ( formField ) {
      let fieldTypeString = this.getFormFieldTypeString( formField.GetType() );
      node = {
        name: formField.GetFullName(),
        type: fieldTypeString,
        value: formField.GetValue(),
        defaultValue: formField.GetDefaultValue(),
        tooltip: formField.GetTooltip(),
        required: (formField.GetFlags() & this.sdk.kFieldFlagRequired) != 0,
        readOnly: (formField.GetFlags() & this.sdk.kFieldFlagReadOnly) != 0
      };
      // options - list box and combo box
      if ( fieldTypeString == "list" || fieldTypeString == "dropdown" ) {
        node["options"] = [];
        for ( let i = 0; i < formField.GetNumOptions(); i++ ) {
          let option = {
            caption: formField.GetOptionCaption(i),
            value: formField.GetOptionCaption(i)
          };
          node["options"].push(option);
        }
      }
      // export values
      if ( fieldTypeString == "radio" || fieldTypeString == "checkbox" ) {
        let exportValues = [];
        for ( let i = 0; i < formField.GetNumExportValues(); i++ ) {
          exportValues.push( formField.GetExportValue(i) );
        }
        node["exportValues"] = exportValues;
      }
      if ( fieldTypeString == "text" || fieldTypeString == "dropdown" ) {
        node["maxLength"] = formField.GetMaxLength();
        node["multiLine"] = (formField.GetFlags() & this.sdk.kFieldFlagMultiline) != 0;
      }
      return node;
    }
  }

  /**
   * Gets the annotation node base.
   * @method getAnnotNodeBase
   * @param {Object} annot
   * @param {Object} annotDict
   * @param {string} subType
   * @returns {Object}
   */
  getAnnotNodeBase(annot, annotDict, subType) {
    let node = {};
    let bbox = new this.sdk.PdfRect();
    annot.GetBBox(bbox);
    node["id"] = annotDict.GetId();
    node["type"] = subType;
    node["bbox"] = {
      top: bbox.top,
      left: bbox.left,
      bottom: bbox.bottom,
      right: bbox.right
    };
    return node;
  }

  /**
   * Extracts particular annot.
   * @method extractAnnot
   * @param {Object} annot Annotation object.
   * @returns {Object}
   */
  extractAnnot(annot) {
    let annotDict = annot.GetObject();
    let subType = annotDict.GetText("Subtype");
    if ( this.data.annotSubtypes.every( i => ['Link', 'Widget', 'Redact'].includes(i) ) ) {
      if (
        subType == 'Link' && this.data.annotSubtypes.includes('Link') ||
        subType == 'Redact' && this.data.annotSubtypes.includes('Redact')
      ) {
        let node = this.getAnnotNodeBase(annot, annotDict, subType);
        return node;
      }
      if ( subType == 'Widget' && this.data.annotSubtypes.includes('Widget') ) {
        let node = this.getAnnotNodeBase(annot, annotDict, subType);
        node["widget"] = this.extractWidgetAnnot(annot);
        return node;
      }
    }
  }

  /**
   * Extracts the page annots of a given page.
   * @method extract
   * @returns {Object}
   */
  extract() {
    let pdfPage = this.pdfDoc.AcquirePage(this.data.pageNumber);
    let pageAnnots = pdfPage.GetNumAnnots();
    let output = {};
    output = [];
    for ( let i = 0; i < pageAnnots; i++ ) {
      let annot = pdfPage.GetAnnot(i);
      if ( !annot ) {
        continue;
      }
      let extractedAnnot = this.extractAnnot(annot);
      if ( extractedAnnot ) {
        output.push( extractedAnnot );
      }
    }
    pdfPage.Release();
    return output;
  }

}

/**
 * Gets the particular document page annots data.
 * @async @function pdfGetPageAnnots
 * @param {Object} sdk Wasm instance of the PDFix SDK.
 * @param {Object} pdfDoc Wasm instance of the document.
 * @param {Object} data The request data.
 * @returns {Object}
 */
async function pdfGetPageAnnots(sdk, pdfDoc, data) {
  data.pageNumber = data.pageNumber - 1;
  let annots = new PdfExtractPageAnnots(sdk, pdfDoc, data);
  let output = {
    pageNumber: data.pageNumber + 1,
    data: annots.extract(),
    annotSubtypes: data.annotSubtypes
  };
  return output;
}

/**
 * CommonJS export format.
 * @module pdfGetPageAnnots
 * @exports pdfGetPageAnnots
 */
module.exports.pdfGetPageAnnots = pdfGetPageAnnots;