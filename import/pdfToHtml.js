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

async function pdfToHtml(sdk, pdfDoc) {
  var pdfix = sdk.GetPdfix();
  // var accountAuth = pdfix.GetAccountAuthorization();
  // const [emailPtr, emailLength] = sdk.allocString('<---LICENSE EMAIL--->');
  // const [keyPtr, keyLength] = sdk.allocString('<---LICENSE KEY--->');
  // accountAuth.Authorize(emailPtr, keyPtr);

  var pdfToHtmlConversion = pdfDoc.CreateHtmlConversion();
  var pdfHtmlParams = new sdk.PdfHtmlParams();

  pdfHtmlParams.flags |= sdk.kHtmlNoExternalCSS | sdk.kHtmlNoExternalJS | sdk.kHtmlNoExternalIMG | sdk.kHtmlNoExternalFONT | sdk.kHtmlNoPageRender;

  pdfToHtmlConversion.SetParams(pdfHtmlParams);

  // save initial document node
  // const docHtml = streamToString(sdk, Utils.fromUInt8Ptr, function(stream){
  //   pdfToHtmlConversion.SaveDocHtml(stream, pdfHtmlParams);
  // });

  // convert only first page of the document if no pages added while document is converted
  // pdfToHtmlConversion.AddPage(0)
  
  const pageHtml = streamToString(sdk, Utils.fromUInt8Ptr, function(stream){
    pdfToHtmlConversion.SaveToStream(stream, 0);
  });
  
  pdfToHtmlConversion.Destroy();
  
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