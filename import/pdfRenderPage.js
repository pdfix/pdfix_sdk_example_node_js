/**
 * @copyright 2020 Pdfix. All Rights Reserved.
 * 
 * @fileoverview Contains and exports function pdfRenderPage.
 * @see pdfRenderPage
 * 
 * @typedef {Object} renderParams
 * @property {number} segmentId Id of the parcitular render segment of the page.
 * @property {number} page Document page number - pages are zero-based.
 * @property {number} zoom Zoom factor to be used for rendering, with 1.0 meaning 100%.
 * @property {number} rotation Rotation of 0 | 90 | 180 | 270 to be used for rendering.
 * @property {number} quality For JPEG format specifies compression level othervise ignored.
 * @property {number} format Image format. 0 for PNG, 1 for JPG.
 * @property {number} width Width of the segment to be rendered.
 * @property {number} height Height of the segment to be rendered.
 * @property {number} top Top position of the segment to be rendered.
 * @property {number} left Left position of the segment to be rendered.
 * 
 * @typedef {Object} renderData
 * @property {number} page Document page number.
 * @property {number} segmentId ID of the particular render segment.
 * @property {number} zoomFactor Zoom factor or the rendered segment.
 * @property {number} rotation Rotation the rendered segment.
 * @property {number} format Image format. 0 for PNG, 1 for JPG.
 * @property {string} base64 Base64 encoded image data of the segment.
 */

/**
 * Renders requested segment of the page based of renderParams.
 * @async @function pdfRenderPage
 * @param {Object} sdk WASM instance of the PDFix SDK.
 * @param {Object} pdfDoc WASM instance of the document.
 * @param {renderParams} renderParams Render parameters.
 * @returns {Promise<renderData>} Promise object representing base64 encoded image data
 *    of the rendered segment.
 */
async function pdfRenderPage(sdk, pdfDoc, renderParams) {
  var pdfix = sdk.GetPdfix();

  var pdfPage = pdfDoc.AcquirePage(renderParams.page-1);
  var pageView = pdfPage.AcquirePageView(renderParams.zoom, renderParams.rotation);

  var devWidth = pageView.GetDeviceWidth();
  var devHeight = pageView.GetDeviceHeight();

  var clipRect = new sdk.PdfDevRect();
  clipRect.left = Number(renderParams.left);
  clipRect.top = Number(renderParams.top);
  clipRect.right = Number(renderParams.left) + Number(renderParams.width);
  clipRect.bottom = Number(renderParams.top) + Number(renderParams.height);

  var clipBox = new sdk.PdfRect();

  if (!(clipRect.left == 0 && clipRect.right == 0 &&
    clipRect.top == 0 && clipRect.bottom == 0)) {
    devWidth = clipRect.right - clipRect.left;
    devHeight = clipRect.bottom - clipRect.top;
    pageView.RectToPage(clipRect, clipBox);
  }

  var image = pdfix.CreateImage(devWidth, devHeight, sdk.kImageDIBFormatArgb);

  var params = new sdk.PdfPageRenderParams();
  params.image = image;
  params.clip_box = clipBox;
  params.redner_flags = sdk.kRenderAnnot;
  pageView.GetDeviceMatrix(params.matrix);
  pdfPage.DrawContent(params, null, null);
  
  var img_params = new sdk.PdfImageParams();
  img_params.format = sdk.kImageFormatJpg;
  img_params.quality = renderParams.quality;

  var mem = pdfix.CreateMemStream();
  image.SaveToStream(mem, img_params);

  var pic = sdk._malloc(mem.GetSize());
  mem.Read(0, pic, mem.GetSize());
  const str_pic = sdk.Util.prototype.base64_enc(pic, mem.GetSize());

  let renderData = {
    page: renderParams.page,
    zoomFactor: renderParams.zoom,
    rotation: renderParams.rotation,
    segmentId: renderParams.segmentId,
    format: renderParams.format,
    base64: str_pic
  }
  
  return renderData;
}

/**
 * CommonJS export format.
 * @module pdfRenderPage
 * @exports pdfRenderPage
 */
module.exports.pdfRenderPage = pdfRenderPage;