# PDFix SDK Wasm example Node.js

Example project demonstrating how to use PDFix SDK WebAssembly build in Node.js.

## Description

For more information please visit [https://pdfix.net](https://pdfix.net).

## Code integration
```javascript
// Loads the PDFix Wasm in JavaScript
PDFIX_WASM().then(function (wasm) {
  PDFIX_SDK = wasm;
  PDFIX_SDK.GetPdfix = function() {
    return wasm.wrapPointer(wasm._GetPdfix(), wasm.Pdfix);
  }
  PDFIX_SDK.GetPdfToHtml = function() {
    return wasm.wrapPointer(wasm._GetPdfToHtml(), wasm.PdfToHtml);
  }
  PDFIX_SDK.allocArray = function (typedArray) {
    var numBytes = typedArray.length * typedArray.BYTES_PER_ELEMENT;
    var ptr = wasm._malloc(numBytes);
    var heapBytes = new Uint8Array(wasm.HEAPU8.buffer, ptr, numBytes);
    heapBytes.set(new Uint8Array(typedArray.buffer));
    return [heapBytes.byteOffset, typedArray.length];
  };
  PDFIX_SDK.allocString = function(string){
    const bufSize = wasm.lengthBytesUTF32(string);
    var buffer = wasm._malloc(bufSize + 4);
    wasm.stringToUTF32(string, buffer, bufSize + 4);
    return [buffer, string.length];
  }

  // your code...

});
```

## Prerequisites
### All platforms
- Node.js 14.5.1 LTS +

## Download
Clone the repository:  
`git clone https://github.com/pdfix/pdfix_sdk_example_node_js`  

...or download as .zip:  
[Download as .zip](https://github.com/pdfix/pdfix_sdk_example_node_js/archive/master.zip)

## Run the example
- Run `./getPdfixWasm.sh` to get the latest PDFix Wasm package
- Run Node.js with --experimental-wasm-threads and --experimental-wasm-bulk-memory flags
- Eg. `node --experimental-wasm-threads --experimental-wasm-bulk-memory pdfix.js`

## Have a question? Need help?
Let us know and we’ll get back to you. Write us to support@pdfix.net or fill the
[contact form](https://pdfix.net/support/).