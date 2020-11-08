function bitflyer_sendOrder_(productcode,position,volume,order_type){ 
  var timestamp = Date.now().toString();
  var method = 'POST';
  var path = '/v1/me/sendchildorder';

  if(order_type.toUpperCase() == "LIMIT"){
    var order_type = "LIMIT";
    if(productcode.match('JPY') || productcode.match('BTC')){
      var price = Number(bitflyer_getPrice_(productcode,position));
    }
  }else if(order_type.toUpperCase() == "MARKET"){
    var order_type = "MARKET";  
  }

  if(position.toUpperCase() == "BUY"){
    var position = "BUY";
  }else if(position.toUpperCase() == "SELL"){
    var position = "SELL";
  }
    
  if(productcode.match("ETH") || productcode.match("BCH")){
    volume = Number(volume).toFixed(0);
  }else{
    volume = Number(volume).toFixed(8);
  }
    
  if(order_type == "MARKET"){
    var body = JSON.stringify({
      product_code: productcode,
      side: position,
      size: volume,
      child_order_type: order_type,
    });
  }else if(order_type == "LIMIT"){
    var body = JSON.stringify({
      product_code: productcode,
      side: position,
      size: volume,
      child_order_type: order_type,
      price: price,
    });
  } 

  var text = timestamp + method + path + body;
  var signature = Utilities.computeHmacSha256Signature(text, secret);
  var sign = signature.reduce(function(str,chr){
    chr = (chr < 0 ? chr + 256 : chr).toString(16);
    return str + (chr.length==1?'0':'') + chr;
  },'');
  
  var url = 'https://api.bitflyer.com' + path;
  var options = {
      method: method,
      payload: body,
      headers: {
        'ACCESS-KEY': key,
        'ACCESS-TIMESTAMP': timestamp,
        'ACCESS-SIGN': sign,
        'Content-Type': 'application/json'
      }
  };

  var response = UrlFetchApp.fetch(url, options);
  if( response != null ){
      var obj = JSON.parse(response.getContentText());
  return obj.child_order_acceptance_id;
  }
}

function bitflyer_getPrice_(productcode,position){
  var price;
  while(!response){
    var response = UrlFetchApp.fetch('https://api.bitflyer.com/v1/ticker?product_code='+productcode);
  }
  if(position.toUpperCase() == "BUY"){
    price = JSON.parse(response)["best_bid"];
  }else if(position.toUpperCase() == "SELL"){
    price = JSON.parse(response)["best_ask"];
  }
  return price;
}

function bitflyer_getOrder_(tid,productcode){
  var timestamp = Date.now().toString();
  var method = 'GET';
  var path = '/v1/me/getchildorders';
  path = path + '?product_code=' + productcode + '&child_order_acceptance_id=' + tid;
  var text = timestamp + method + path;
  var signature = Utilities.computeHmacSha256Signature(text, secret);
  var sign = signature.reduce(function(str,chr){
    chr = (chr < 0 ? chr + 256 : chr).toString(16);
    return str + (chr.length==1?'0':'') + chr;
  },'');

  var url = 'https://api.bitflyer.com' + path;
  var options = {
      method: method,
      headers: {
        'ACCESS-KEY': key,
        'ACCESS-TIMESTAMP': timestamp,
        'ACCESS-SIGN': sign,
        'Content-Type': 'application/json'
      }
  };

  var response = UrlFetchApp.fetch(url, options);

  if( response != null ){
    var json = JSON.parse(response.getContentText());
    var ordStatus = json[0].child_order_state;
    var outstanding = json[0].outstanding_size;
    var time = json[0].child_order_date;
    return [ordStatus,outstanding,time];
  }
}

function bitflyer_Cancel_(tid,productcode){ 
  var timestamp = Date.now().toString();
  var method = 'POST';
  var path = '/v1/me/cancelchildorder';
  
  var body = JSON.stringify({
    product_code: productcode,
    child_order_acceptance_id: tid
  });
 
  var text = timestamp + method + path + body;
  var signature = Utilities.computeHmacSha256Signature(text, secret);
  var sign = signature.reduce(function(str,chr){
    chr = (chr < 0 ? chr + 256 : chr).toString(16);
    return str + (chr.length==1?'0':'') + chr;
  },'');
  
  var url = 'https://api.bitflyer.com' + path;
  var options = {
      method: method,
      payload: body,
      headers: {
        'ACCESS-KEY': key,
        'ACCESS-TIMESTAMP': timestamp,
        'ACCESS-SIGN': sign,
        'Content-Type': 'application/json'
      }
  };

  var response = UrlFetchApp.fetch(url, options);
  return response;
}

function bitflyer_getTime_(exchange,productcode,target){
  var key = bitflyer_key;
  var secret = bitflyer_secret;
  var timestamp = Date.now().toString();
  var method = 'GET';
  var path = '/v1/me/getexecutions';
  // path にパラメータを追加
  var query = '?product_code=' + productcode + '&child_order_acceptance_id=' + target;
  var text = timestamp + method + path + query;
  var signature = Utilities.computeHmacSha256Signature(text, secret);
  var sign = signature.reduce(function(str,chr){
    chr = (chr < 0 ? chr + 256 : chr).toString(16);
    return str + (chr.length==1?'0':'') + chr;
  },'');
  
  var url = 'https://api.bitflyer.com' + path + query;
  var options = {
      method: method,
      headers: {
        'ACCESS-KEY': key,
        'ACCESS-TIMESTAMP': timestamp,
        'ACCESS-SIGN': sign,
        'Content-Type': 'application/json'
      }
  };

  //送信してレスポンス取得
  var response = UrlFetchApp.fetch(url, options);
  
  // レスポンスをJSONオブジェクトに
  var json = JSON.parse(response.getContentText());
  
  // ステータスと値段を取り出す
  for each(var obj in json){
    var exec_date = obj.exec_date;
  }
  var time;
  try{  
    var splits = exec_date.split("T");
    var datumSplits = splits[0].split("-");
    var yyyy = datumSplits[0];
    var MM = Number(datumSplits[1]) - 1;
    var dd = datumSplits[2];
    
    var hms = splits[1].split(":");
    var hours = Number(hms[0]) + 9;
    var minutes = hms[1];
    
    var secondsms = hms[2].split(".");
    var seconds = secondsms[0];
    var milliseconds = secondsms[1] || "000";
    if(milliseconds.length == 1){
      milliseconds += '00'; 
    }else if(milliseconds.length == 2){
      milliseconds += '0'
    };

    var exec_date2 = new Date(yyyy, MM, dd, hours, minutes, seconds,milliseconds);
    var time = Utilities.formatDate(exec_date2,"JST","yyyy-MM-dd'T'HH:mm:ss.sss");
  }catch(e){
    console.log("1970?: " + time);
  }
  while(!time.indexOf("1970-")){
    var time = Utilities.formatDate(new Date(),"JST","yyyy-MM-dd'T'HH:mm:ss.sss");
  }
  
  return time;
}

function bitflyer_getBalance_(productcode){
  var timestamp = Date.now().toString();
  var method = 'GET';
  var path = '/v1/me/getbalance';
  var text = timestamp + method + path;
  var signature = Utilities.computeHmacSha256Signature(text, secret);
  var sign = signature.reduce(function(str,chr){
    chr = (chr < 0 ? chr + 256 : chr).toString(16);
    return str + (chr.length==1?'0':'') + chr;
  },'');

  var url = 'https://api.bitflyer.com' + path;
  var options = {
      method: method,
      headers: {
        'ACCESS-KEY': key,
        'ACCESS-TIMESTAMP': timestamp,
        'ACCESS-SIGN': sign,
        'Content-Type': 'application/json'
      }
  };

  var response = UrlFetchApp.fetch(url, options);

  if( response == null ){
    return undefined;
  }
  var obj = JSON.parse(response.getContentText());
  var code = productcode.split('_')[0];
  for (var i=0; i<obj.length; i++) {
    if (obj[i]['currency_code'] == code) {
      return obj[i]['amount'];
    }
  }
  return undefined;
}

function bitflyer_getPositions_(productcode){
  var timestamp = Date.now().toString();
  var method = 'GET';
  var path = '/v1/me/getpositions';
  path = path + '?product_code=' + productcode;
  var text = timestamp + method + path;
  var signature = Utilities.computeHmacSha256Signature(text, secret);
  var sign = signature.reduce(function(str,chr){
    chr = (chr < 0 ? chr + 256 : chr).toString(16);
    return str + (chr.length==1?'0':'') + chr;
  },'');

  var url = 'https://api.bitflyer.com' + path;
  var options = {
      method: method,
      headers: {
        'ACCESS-KEY': key,
        'ACCESS-TIMESTAMP': timestamp,
        'ACCESS-SIGN': sign,
        'Content-Type': 'application/json'
      }
  };

  var response = UrlFetchApp.fetch(url, options);

  if( response == null ){
    return undefined;
  }
  var obj = JSON.parse(response.getContentText());
  var size = 0.0;
  for (var i=0; i<obj.length; i++) {
    size += obj[i]['size'];
  }
  return size;
}