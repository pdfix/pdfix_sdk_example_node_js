/**
 * @copyright 2021 Pdfix. All Rights Reserved.
 * @fileoverview Sets particular PDF form field value.
 * @see https://github.com/pdfix/pdfix_sdk_example_cpp/blob/master/src/FillForm.cpp
 * @see https://github.com/pdfix/pdfix_sdk_example_cpp/blob/master/src/ImportFormData.cpp
 * @see https://github.com/pdfix/pdfix_sdk_example_cpp/blob/master/src/SetFormFieldValue.cpp
 */

/**
 * Sets the field's value as string. Multiple values should be comma-separated.
 * @async @function pdfGetPageProperties
 * @param {Object} sdk WASM instance of the PDFix SDK.
 * @param {Object} pdfDoc WASM instance of the document.
 * @returns {Promise<boolean>} true if succeeded, false otherwise.
 */
async function pdfSetFormFieldValue(sdk, pdfDoc, data) {
  let formFieldName = data.annot.widget.name;
  let pdfFormField = pdfDoc.GetFormFieldByName(formFieldName);
  if ( pdfFormField ) {
    let fieldValue = data.annot.widget.value;
    pdfFormField.SetValue(fieldValue);
  }
  return true;
}

/**
 * CommonJS export format.
 * @module pdfSetFormFieldValue
 * @exports pdfSetFormFieldValue
 */
module.exports.pdfSetFormFieldValue = pdfSetFormFieldValue;