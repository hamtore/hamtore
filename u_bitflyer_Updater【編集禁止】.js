function bitflyer_DatabaseUpdater_(){
  key = bitflyer_key;
  secret = bitflyer_secret;
  if (key == "" || secret == ""){
    throw new Error("Key or secret key is empty");
    return;
  }
  var price2 = [];
  var commission2 = [];
  var exec_date2 = [];
  var tids2 = [];
  var productcodes = [];
  var tids = [];
  var times = [];
  var results = [];

  var ids = [];
  var orderids = [];
  var sides = [];
  var prices = [];
  var sizes = [];
  var commissions = [];
  var exec_dates = [];
  var acceptances = [];

  //取引履歴を参照
  var [productcodes,tids,times] = bitflyer_getTable_();
  try{
    var len = productcodes.length;    
  }catch(e){
    return;
  }
  if (len > 20){
    len = 20;
  }
  for(var i=0; i<len; i++){
    var productcode = productcodes[i];
    var tid = tids[i];
    var time = times[i];
    var result = bitflyer_getExecutions_(productcode,tid,time);
    Logger.log(result);
    if(result){
      ids.push(result[0]);
      orderids.push(result[1]);
      sides.push(result[2]);
      prices.push(result[3]);
      sizes.push(result[4]);
      commissions.push(result[5]);
      exec_dates.push(result[6]);
      acceptances.push(result[7]);
    }
  }
  results = [ids,orderids,sides,prices,sizes,commissions,exec_dates,acceptances];

  var len = results[0].length;
  for (var i=0; i<len; i++){
    //    var id = results[0][i];
    //    var orderid = results[1][i];
    //    var side = results[2][i];
    var price = results[3][i];
    price2.push(price);
    //    var size = results[4][i];
    var commission = results[5][i];
    commission2.push(commission);
    var exec_date = results[6][i];
    exec_date2.push(exec_date);
    var acceptance = results[7][i];
    tids2.push(acceptance);
  }

  //Databaseの価格を更新する
  bitflyer_updateTable_(tids2,price2,exec_date2);
}

function bitflyer_getTable_(){
  var productcodes = []
  var tids = [];
  var times = [];
  var result = [];
  //Databaseから取得
  var status_sheet = spreadSheet.getSheetByName('history');
  var status = status_sheet.getDataRange().getValues();
  for(var i=1;i<status.length;i++){
    if(status[i][6] === "bitflyer" && status[i][8] === "" && status[i][2] === 0){//Exchange: bitflyer & Profit: "" 
      result.push(status[i]);
    }
  }

  if(!result){
    return;
  }
  
  for(var i=0; i<result.length; i++){
    var time = result[i][0];
    var productcode = result[i][1];
    var tid = result[i][7];
    productcodes.push(productcode);
    tids.push(tid);
    times.push(time);
  }
  return [productcodes,tids,times];
}

function bitflyer_getExecutions_(productcode,target,time){
  var timestamp = Date.now().toString();
  var method = 'GET';
  var path = '/v1/me/getexecutions';
  // path にパラメータを追加
  var query = '?product_code=' + productcode + '&child_order_acceptance_id=' + target;
  var text = timestamp + method + path + query; // GETなので bodyはなくてOK
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
  Logger.log(json);
  Logger.log(target);
  // ステータスと値段を取り出す
  for each(var obj in json){
    var id = obj.id;
    var orderid = obj.child_order_id;
    var side = obj.side;
    var price = obj.price;
    var size = obj.size;
    var commission = obj.commission;
    var exec_date = obj.exec_date;
    var acceptance = obj.child_order_acceptance_id;
  }
  
  if(!exec_date){
    exec_date = Utilities.formatDate(new Date(), 'Asia/Tokyo', "yyyy-MM-dd'T'HH:mm:ss.sss");
  }
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
  
  return [id,orderid,side,price,size,commission,time,acceptance];
}

function bitflyer_updateTable_(tids,prices,exec_dates){
  var tid,price,time,status_sheet,status;
  for (var i=0; i<tids.length; i++){
    tid = tids[i];
    price = prices[i];
    time = exec_dates[i];
    status_sheet = spreadSheet.getSheetByName('history');
    status = status_sheet.getDataRange().getValues();
    for(var j=1;j<status.length;j++){
      if(status[j][7] === tid && status[j][8] === ""){//ID: tid & Profit: "" 
        status[j][0] = time;
        status[j][2] = price;
        status_sheet.getRange(j+1,1,1,status[j].length).setValues([status[j]]);
        break;
      }
    }
    Utilities.sleep(1000);
  }
}