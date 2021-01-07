function order_insert_(time,productcode,price,position,strategy,volume,outstanding,exchange,tid,memo){
  if(position == "Buy"){
    position = "BUY";
  }else if(position == "Sell"){
    position = "SELL";
  }
  
  var lock = LockService.getScriptLock()
  if (lock.tryLock(10000)) {
    try {
      var status = spreadSheet.getSheetByName('order');
      status.appendRow([time,productcode,price,position,strategy,volume,outstanding,exchange,tid,memo,0]);
    }catch(e){
      sendMessage_(e);
    }finally{
      lock.releaseLock();
    }
  }else{
    sendMessage_("write order failed because of lock.");
  }
}

function order_errorcount_(tid,errorcount){
  var status = spreadSheet.getSheetByName('order');
  var data = status.getDataRange().getValues();
  for(var i=0;i<data.length;i++){
    if(data[i][8] === tid){
      data[i][10] = errorcount;
      status.getRange(i+1,1,1,data[i].length).setValues([data[i]]);
    }
  }
}

function order_get_(){
  var status = spreadSheet.getSheetByName('order');
  var result = status.getDataRange().getValues();
  
  var times = [];
  var productcodes = [];
  var prices = [];
  var positions = [];
  var strategies = [];
  var volumes = [];
  var outstandings = [];
  var exchanges = [];
  var ids = [];
  var memos = [];
  var errorcounts = [];
  //ordertableにない場合、終了
  if (!result){
    return;
  }

  for(var i=0;i<result.length;i++){
    times[i] = result[i][0];
    productcodes[i] = result[i][1];
    prices[i] = result[i][2];
    positions[i] = result[i][3];
    strategies[i] = String(result[i][4]);
    volumes[i] = result[i][5];
    outstandings[i] = result[i][6];
    exchanges[i] = result[i][7];
    ids[i] = result[i][8];
    memos[i] = result[i][9];
    errorcounts[i] = result[i][10];
  }
  return [times,productcodes,prices,positions,strategies,volumes,outstandings,exchanges,ids,memos,errorcounts];
}

function order_delete_(tid){
  var status = spreadSheet.getSheetByName('order');
  var data = status.getDataRange().getValues();
  for(var i=0;i<data.length;i++){
    if(data[i][8] === tid){
      status.deleteRow(i+1);
      return;
    }
  }
  return;
}
