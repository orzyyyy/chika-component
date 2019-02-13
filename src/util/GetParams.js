export const GetParams = name => {
  let reg = new RegExp('(^|&)' + name + '=([^&]*)(&|$)'); // 匹配目标参数
  let result =
    window.location.hash.split('?').length > 1
      ? window.location.hash.split('?')[1].match(reg)
      : 0; // 对querystring匹配目标参数

  if (result != null) {
    return result[2] === 'undefined' ? undefined : result[2];
    // return decodeURIComponent(result[2]);
  }
  return null;
};
