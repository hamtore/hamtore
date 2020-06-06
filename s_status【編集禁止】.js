function status_get_(strategy){
  //status_bybit
  var status_sheet_bybit = spreadSheet.getSheetByName('status_bybit');
  var status_bybit = status_sheet_bybit.getDataRange().getValues();
  var result_bybit;
  for(var i=1;i<status_bybit.length;i++){
    if(String(status_bybit[i][0]) === strategy){
      result_bybit = status_bybit[i];
      break;
    }
  }
  //status_bitflyer
  var status_sheet_bitflyer = spreadSheet.getSheetByName('status_bitflyer');
  var status_bitflyer = status_sheet_bitflyer.getDataRange().getValues();
  var result_bitflyer;
  for(var i=1;i<status_bitflyer.length;i++){
    if(String(status_bitflyer[i][0]) === strategy){
      result_bitflyer = status_bitflyer[i];
      break;
    }
  }

  //値の取得
  if(result_bybit){
    var strategy = String(result_bybit[0]).trim();
    var active = result_bybit[1].trim() || "OFF";
    var productcode = result_bybit[2].trim();
    var volume = Number(result_bybit[3]);
    var todoubles = result_bybit[5].trim() || null;
    var exchange = result_bybit[6].trim();
    var order_type = result_bybit[7].trim() || "MARKET";
    var lats = Number(result_bybit[8]) || null;
  }else if(result_bitflyer){
    var strategy = String(result_bitflyer[0]).trim();
    var active = result_bitflyer[1].trim() || "OFF";
    var productcode = result_bitflyer[2].trim();
    var volume = Number(result_bitflyer[3]);
    var todoubles = result_bitflyer[5].trim() || null;
    var exchange = result_bitflyer[6].trim();
    var order_type = result_bitflyer[7].trim() || "MARKET";
    var lats = Number(result_bitflyer[8]);
  }else{
    //どちらのstatusにない場合、終了
    return [null,"OFF",null,0,null,null,null];
  }
  
  lats = Math.ceil((lats) * 100) / 100;
  
  if(productcode.indexOf("_") != -1 && exchange != "bitflyer"){
    productcode = productcode.replace('_','');
  }

  return [strategy,active,productcode,volume,"",todoubles,exchange,order_type,lats];
}

function todoubles_increase_(todoubles,volume,strategy,exchange){
  //２回目以降は取引量を倍にする
  try{
    if(todoubles == 'ON'){
      if(exchange == "bitflyer"){
        var status_sheet = spreadSheet.getSheetByName('status_bitflyer');
      }else if(exchange == "bybit" || exchange == "bybit_testnet"){
        var status_sheet = spreadSheet.getSheetByName('status_bybit');
      }
      var status = status_sheet.getDataRange().getValues();
      for(var i=1;i<status.length;i++){
        if(status[i][0] === strategy){
          status[i][3] = volume * 2;//Volume
          status[i][5] = "OFF";// ToDoubles
          status_sheet.getRange(i+1,1,1,10).setValues([status[i]]);
          break;
        }
      }
    }
  }catch (e) {
    var message = "初回取引後に取引量２倍エラー：" + e;
    sendMessage_(message);
  }
}

function strategy_start_(strategy,exchange){
  //ストラテジーを開始する
  try{
    if(exchange == "bitflyer"){
      var status_sheet = spreadSheet.getSheetByName('status_bitflyer');
    }else if(exchange == "bybit" || exchange == "bybit_testnet"){
      var status_sheet = spreadSheet.getSheetByName('status_bybit');
    }
    var status = status_sheet.getDataRange().getValues();
    for(var i=1;i<status.length;i++){
      if(status[i][0] === strategy){
        status[i][1] = "ON"; // Active
        status_sheet.getRange(i+1,1,1,10).setValues([status[i]]);
        break;
      }
    }
  }catch (e) {
    var message = strategy + "開始エラー：" + e;
    sendMessage_(message);
  }
}

function strategy_stop_(strategy,exchange){
  //ストラテジーを停止する
  try{
    if(exchange == "bitflyer"){
      var status_sheet = spreadSheet.getSheetByName('status_bitflyer');
    }else if(exchange == "bybit" || exchange == "bybit_testnet"){
      var status_sheet = spreadSheet.getSheetByName('status_bybit');
    }
    var status = status_sheet.getDataRange().getValues();
    for(var i=1;i<status.length;i++){
      if(status[i][0] === strategy){
        status[i][1] = "OFF"; // Active
        status_sheet.getRange(i+1,1,1,10).setValues([status[i]]);
        break;
      }
    }
  }catch (e) {
    var message = strategy + "停止エラー：" + e;
    sendMessage_(message);
  }
}

function emergency_stop_(){
  //全ストラテジーを緊急停止する
  try{
    var status_sheet_bitflyer = spreadSheet.getSheetByName('status_bitflyer');
    var status_bitflyer = status_sheet_bitflyer.getDataRange().getValues();
    for(var i=1;i<status_bitflyer.length;i++){
      if(status_bitflyer[i][1] === "ON"){
        status_bitflyer[i][1] = "OFF"; // Active
        status_sheet_bitflyer.getRange(i+1,1,1,10).setValues([status_bitflyer[i]]);
      }
    }
    var status_sheet_bybit = spreadSheet.getSheetByName('status_bybit');
    var status_bybit = status_sheet_bybit.getDataRange().getValues();
    for(var i=1;i<status_bybit.length;i++){
      if(status_bybit[i][1] === "ON"){
        status_bybit[i][1] = "OFF"; // Active
        status_sheet_bybit.getRange(i+1,1,1,10).setValues([status_bybit[i]]);
      }
    }
  }catch (e) {
    var message = "緊急停止エラー:" + e + "\n手動でストラテジーを全停止してください";
    sendMessage_(message);
  }
}