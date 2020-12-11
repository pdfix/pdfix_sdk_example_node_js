function alloc(sdk, len){
  return [sdk._malloc(len), len];
}

function fromUTF8(sdk, ptr) {
  let string = sdk.UTF8ToString(ptr);
  sdk._free(ptr);
  return string;
}

function fromUTF16(sdk, ptr) {
  let string = sdk.UTF16ToString(ptr);
  sdk._free(ptr);
  return string;
}

function fromUTF32(sdk, ptr, len) {
  let string = sdk.UTF32ToString(ptr);
  sdk._free(ptr);
  return string;
}

function fromUInt8Ptr(sdk, ptr, len) {
  let string = ''
  for (let i = 0; i < len; i++) {
    string += String.fromCharCode(sdk.HEAP8[ptr + i])
  }
  return string;
}

function fromWide(sdk, ptr, len){
    let string = ''
    for (let i = 0; i < len; i++) {
        string += String.fromCharCode(sdk.getValue(ptr + 4 * i, 'i32'));
    }
    sdk._free(ptr);
    return string;
}

const Utils = {
    alloc: alloc,
    fromUTF8: fromUTF8,
    fromUTF16: fromUTF16,
    fromUTF32: fromUTF32,
    fromUInt8Ptr: fromUInt8Ptr,
    fromWide: fromWide
}

module.exports.Utils = Utils;