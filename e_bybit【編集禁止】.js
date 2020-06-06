function bybit_sendOrder_(productcode,position,volume,exchange,order_type){
  var timestamp = Date.now().toString();
  var method = 'POST';
  var path = '/v2/private/order/create';

  if(exchange == "bybit"){
    key = bybit_key;
    secret = bybit_secret;
  }else if(exchange == "bybit_testnet"){
    key = bybit_testnet_key;
    secret = bybit_testnet_secret;
  }

  if(position.toUpperCase() == "BUY"){
    var position = "Buy";
  }else if(position.toUpperCase() == "SELL"){
    var position = "Sell";
  }

  if(volume < minimumVolume){
    volume = minimumVolume;
  }
  volume = Number(volume).toFixed(0);

  if(order_type.toUpperCase() == "LIMIT"){
    var order_type = "Limit";
    var price = Number(bybit_getPrice_(productcode,position,exchange));
    var param_str = "api_key=" + key + "&order_type=" + order_type + "&price=" + price + "&qty=" + volume + "&side=" + position + "&symbol=" + productcode + "&time_in_force=GoodTillCancel" + "&timestamp=" + timestamp;
  }else if(order_type.toUpperCase() == "MARKET"){
    var order_type = "Market";
    var param_str = "api_key=" + key + "&order_type=" + order_type + "&qty=" + volume + "&side=" + position + "&symbol=" + productcode + "&time_in_force=GoodTillCancel" + "&timestamp=" + timestamp;
  }
  
  var signature = Utilities.computeHmacSha256Signature(param_str, secret);
  var sign = signature.reduce(function(str,chr){
    chr = (chr < 0 ? chr + 256 : chr).toString(16);
    return str + (chr.length==1?'0':'') + chr;
  },'');
  
  if(order_type == "Market"){
    var body = JSON.stringify({
      api_key: key,
      order_type: order_type,
      qty: volume,
      side: position,
      symbol: productcode,
      time_in_force: "GoodTillCancel",
      timestamp: timestamp,
      sign: sign
    });
  }else if(order_type == "Limit"){
    var body = JSON.stringify({
      api_key: key,
      order_type: order_type,
      qty: volume,
      side: position,
      symbol: productcode,
      time_in_force: "GoodTillCancel",
      timestamp: timestamp,
      price: price,
      sign: sign
    });
  }

  if(exchange == "bybit_testnet"){
    var url = 'https://api-testnet.bybit.com' + path;
  }else if(exchange == "bybit"){
    var url = 'https://api.bybit.com' + path;
  }

  var options = {
    url: url,
    method: method,
    payload: body,
    headers: {'Content-Type': 'application/json'}
  };

  var response = UrlFetchApp.fetch(url, options);
  if( response != null ){
    var json = JSON.parse(response.getContentText());
    return json.result.order_id;
  }
}

function bybit_getPrice_(productcode,position,exchange){
  if(exchange == "bybit"){
    key = bybit_key;
    secret = bybit_secret;
  }else if(exchange == "bybit_testnet"){
    key = bybit_testnet_key;
    secret = bybit_testnet_secret;
  }
  
  var timestamp = Math.floor(new Date().getTime() / 1000) - 60;
  var method = 'GET';
  var path = '/v2/public/tickers';
  var param_str = "symbol=" + productcode.toUpperCase();
  
  if(exchange == "bybit_testnet"){
    var url = 'https://api-testnet.bybit.com' + path + "?" + param_str;
  }else if(exchange == "bybit"){
    var url = 'https://api.bybit.com' + path + "?" + param_str;
  }
  
  var options = {
    url: url,
    method: method,
    headers: {'Content-Type': 'application/x-www-form-urlencoded'}
  };
  
  //送信してレスポンス取得
  var response = UrlFetchApp.fetch(url, options);
  
  // レスポンスをJSONオブジェクトに
  var json = JSON.parse(response.getContentText());
  if(position == 'Buy'){
    price = json.result[0].bid_price;
  }else if(position == 'Sell'){
    price = json.result[0].ask_price;
  }
  return price;
}

function bybit_getOrder_(order_id,productcode,exchange,position){
  if(exchange == "bybit"){
    key = bybit_key;
    secret = bybit_secret;
  }else if(exchange == "bybit_testnet"){
    key = bybit_testnet_key;
    secret = bybit_testnet_secret;
  }

  var timestamp = Date.now().toString();
  var method = 'GET';
  var path = '/v2/private/order';
  var param_str = "api_key=" + key + "&order_id=" + order_id + "&symbol=" + productcode + "&timestamp=" + timestamp;

  var signature = Utilities.computeHmacSha256Signature(param_str, secret);
  var sign = signature.reduce(function(str,chr){
    chr = (chr < 0 ? chr + 256 : chr).toString(16);
    return str + (chr.length==1?'0':'') + chr;
  },'');

  if(exchange == "bybit_testnet"){
    var url = 'https://api-testnet.bybit.com' + path + "?" + param_str + "&sign=" + sign;
  }else if(exchange == "bybit"){
    var url = 'https://api.bybit.com' + path + "?" + param_str + "&sign=" + sign;
  }

  var options = {
    url: url,
    method: method,
    headers: {'Content-Type': 'application/x-www-form-urlencoded'}
  };

  //送信してレスポンス取得
  var response = UrlFetchApp.fetch(url, options);
  
  // レスポンスをJSONオブジェクトに
  var json = JSON.parse(response.getContentText());
  var ordStatus = json.result.order_status;
  var outstanding = Number(json.result.leaves_qty).toFixed(0);
  var time = json.result.created_at;
  return [ordStatus,outstanding,time];
}

function bybit_Cancel_(order_id,exchange){
  if(exchange == "bybit"){
    key = bybit_key;
    secret = bybit_secret;
  }else if(exchange == "bybit_testnet"){
    key = bybit_testnet_key;
    secret = bybit_testnet_secret;
  }

  var timestamp = Date.now().toString();
  var method = 'POST';
  var path = '/v2/private/order/cancel';

  var param_str = "api_key=" + key + "&order_id=" + order_id + "&symbol=" + productcode + "&timestamp=" + timestamp;
  var signature = Utilities.computeHmacSha256Signature(param_str, secret);
  var sign = signature.reduce(function(str,chr){
    chr = (chr < 0 ? chr + 256 : chr).toString(16);
    return str + (chr.length==1?'0':'') + chr;
  },'');
  
  var body = JSON.stringify({
    api_key: key,
    order_id: order_id,
    symbol: productcode,
    timestamp: timestamp,
    sign: sign
  });
  
  if(exchange == "bybit_testnet"){
    var url = 'https://api-testnet.bybit.com' + path;
  }else if(exchange == "bybit"){
    var url = 'https://api.bybit.com' + path;
  }
  
  var options = {
    url: url,
    method: method,
    payload: body,
    headers: {'Content-Type': 'application/json'}
  };

  var response = UrlFetchApp.fetch(url, options);
  return [response];
}

function bybit_PriceUpdate_(productcode,position,exchange,order_id){
  var timestamp = Date.now().toString();
  var method = 'POST';
  var path = '/open-api/order/replace';

  if(position.toUpperCase() == "BUY"){
    var position = "Buy";
  }else if(position.toUpperCase() == "SELL"){
    var position = "Sell";
  }

  var price = Number(bybit_getPrice_(productcode,position,exchange));

  var param_str = "api_key=" + key + "&order_id=" + order_id + "&p_r_price=" + price + "&symbol=" + productcode + "&timestamp=" + timestamp;
  var signature = Utilities.computeHmacSha256Signature(param_str, secret);
  var sign = signature.reduce(function(str,chr){
    chr = (chr < 0 ? chr + 256 : chr).toString(16);
    return str + (chr.length==1?'0':'') + chr;
  },'');

  var body = JSON.stringify({
    api_key: key,
    order_id: order_id,
    p_r_price: price,
    symbol: productcode,
    timestamp: timestamp,
    sign: sign
  });

  if(exchange == "bybit_testnet"){
    var url = 'https://api-testnet.bybit.com' + path;
  }else if(exchange == "bybit"){
    var url = 'https://api.bybit.com' + path;
  }
  
  var options = {
    url: url,
    method: method,
    payload: body,
    headers: {'Content-Type': 'application/json'}
  };

  var response = UrlFetchApp.fetch(url, options);
  return [response];
}

function bybit_getTime_(exchange,productcode,order_id){
  if(exchange == "bybit"){
    key = bybit_key;
    secret = bybit_secret;
  }else if(exchange == "bybit_testnet"){
    key = bybit_testnet_key;
    secret = bybit_testnet_secret;
  }

  var timestamp = Date.now().toString();
  var method = 'GET';
  var path = '/v2/private/order';
  var param_str = "api_key=" + key + "&order_id=" + order_id + "&symbol=" + productcode + "&timestamp=" + timestamp;

  var signature = Utilities.computeHmacSha256Signature(param_str, secret);
  var sign = signature.reduce(function(str,chr){
    chr = (chr < 0 ? chr + 256 : chr).toString(16);
    return str + (chr.length==1?'0':'') + chr;
  },'');

  if(exchange == "bybit_testnet"){
    var url = 'https://api-testnet.bybit.com' + path + "?" + param_str + "&sign=" + sign;
  }else if(exchange == "bybit"){
    var url = 'https://api.bybit.com' + path + "?" + param_str + "&sign=" + sign;
  }

  var options = {
    url: url,
    method: method,
    headers: {'Content-Type': 'application/x-www-form-urlencoded'}
  };

  //送信してレスポンス取得
  var response = UrlFetchApp.fetch(url, options);
  // レスポンスをJSONオブジェクトに
  var json = JSON.parse(response.getContentText());

  // ステータスと値段を取り出す
  var exec_date = json.result.updated_at;
  exec_date = exec_date.slice(0, -1);
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
    var milliseconds = secondsms[1].slice(0,-3) || "000";
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