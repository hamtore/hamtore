function history_insert_(time,productcode,price,position,strategy,volume,exchange,tid){
  //historyへの記録
  var lasttotalvolume = getLastTradeTotalVolume_(strategy);
  var totalvolume = Number(lasttotalvolume[0])*1.0;
 
  if(position.toUpperCase() == "BUY"){
    position = "BUY"
    totalvolume += Number(volume);
  }else if(position.toUpperCase() == "SELL"){
    position = "SELL"
    totalvolume -= Number(volume);
  }
  if(exchange == "bitflyer"){
    totalvolume = Number(totalvolume).toFixed(4);
    volume = Number(volume).toFixed(4);
  }else if (exchange == "bybit" || exchange == "bybit_testnet"){
    totalvolume = Number(totalvolume).toFixed(0);
    volume = Number(volume).toFixed(0);
  }

  try{
    if(exchange == "bybit" || exchange == "bybit_testnet"){
      var time = bybit_getTime_(exchange,productcode,tid);
    }else if(exchange == "bitflyer"){
      var time = bitflyer_getTime_(exchange,productcode,tid);
    }
  }catch(e){
    console.log(e);
  }

  while(!time.indexOf("1970-")){
    var time = Utilities.formatDate(new Date(),"JST","yyyy-MM-dd'T'HH:mm:ss.sss");
  }

  var lock = LockService.getScriptLock()
  if (lock.tryLock(10000)) {
    try {
      var status = spreadSheet.getSheetByName('history');
      status.appendRow([time,productcode,price,position,strategy,volume,exchange,tid,"","",totalvolume]);
    }catch(e){
      sendMessage_(e);
    }finally{
      lock.releaseLock();
    }
  }else{
    sendMessage_("write history failed because of lock.");
  }
  return [totalvolume, time];
}