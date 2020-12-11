const { Utils } = require('./utils.js');

function streamToString(sdk, toStrFunc, saveToStream){
  var memStream = sdk.GetPdfix().CreateMemStream();
  saveToStream(memStream);
  var ptr = sdk._malloc(memStream.GetSize());
  memStream.Read(0, ptr, memStream.GetSize());
  const str = toStrFunc(sdk, ptr, memStream.GetSize());
  memStream.Destroy();
  return str;
}

async function pdfToHtml(sdk, pdfDoc, rp){
  var pdfix = sdk.GetPdfix();
  var accountAuth = pdfix.GetAccountAuthorization();
  const [emailPtr, emailLength] = sdk.allocString(""); // LICENSE E-MAIL
  const [keyPtr, keyLength] = sdk.allocString(""); // LICENSE KEY
  accountAuth.Authorize(emailPtr, keyPtr);

  var pdfToHtml = sdk.GetPdfToHtml();
  pdfToHtml.Initialize(pdfix);
  var htmlDoc = pdfToHtml.OpenHtmlDoc(pdfDoc);
  var pdfHtmlParams = new sdk.PdfHtmlParams();

  pdfHtmlParams.flags |= sdk.kHtmlNoExternalCSS | sdk.kHtmlNoExternalJS | sdk.kHtmlNoExternalIMG | sdk.kHtmlNoExternalFONT | sdk.kHtmlNoPageRender;

  /*
  const docHtml = streamToString(sdk, Utils.fromUInt8Ptr, function(stream){
    htmlDoc.SaveDocHtml(stream, pdfHtmlParams);
  });
  */

  
  const pageHtml = streamToString(sdk, Utils.fromUInt8Ptr, function(stream){
    htmlDoc.SavePageHtml(stream, pdfHtmlParams, 0);
  });
  
  
  /*
  const css = streamToString(sdk, Utils.fromUInt8Ptr, function(stream){
    pdfToHtml.SaveCSS(stream);
  });
  */

  /*
  const js = streamToString(sdk, Utils.fromUInt8Ptr, function(stream){
    pdfToHtml.SaveJavaScript(stream);
  });
  */

  //console.log("docHtml:\n", docHtml);
  console.log("pageHtml:\n", pageHtml);
  //console.log("css:\n", css);
  //console.log("js:\n", js);
  return "Done";
}

module.exports.pdfToHtml = pdfToHtml;