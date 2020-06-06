function hamsterlimit_(){
  var lock = LockService.getScriptLock();

  if(!lock.tryLock(55000)){
    console.log("end :locking HamsterLimit");
    return;
  }
  var result = order_get_();
  
  if(!result){
    lock.releaseLock();
    return;
  }
  var tablecount = 0;
  
  while(result[0][tablecount]){
    tablecount += 1;
  }

  for(var i=1;i<tablecount;i++){
    var time = result[0][i];
    var productcode = result[1][i];
    var price = Number(result[2][i]);
    var position = result[3][i];
    var strategy = result[4][i];
    var volume = Number(result[5][i]);
    var outstanding = Number(result[6][i]);  
    var exchange = result[7][i];
    var tid = result[8][i];
    var errorcount = Number(result[9][i]);
    if(!errorcount || isNaN(errorcount)){
      var errorcount = 0;
    };
    var order_type = "Limit";
    
    //strategyのactive確認
    var status = status_get_(strategy,exchange); //[strategy,active,productcode,volume,time,todoubles,exchange,order_type,lats]
    var active,productcode,volume,todoubles,exchange,order_type,lats;
    if(status){
      active = status[1]; //ON or OFF
      if(active.toUpperCase() != "ON"){
        order_delete_(tid);
      }
    }else{
      continue;
    }
    var errorcount_upperlimit = 10;
    //order, tidの確認
    try{
      if(exchange == "bybit"){
        key = bybit_key;
        secret = bybit_secret;
        var result2 = bybit_getOrder_(tid,productcode,exchange,position);
      }else if(exchange == "bybit_testnet"){
        key = bybit_testnet_key;
        secret = bybit_testnet_secret;
        var result2 = bybit_getOrder_(tid,productcode,exchange,position);
      }else if(exchange == "bitflyer"){
        key = bitflyer_key;
        secret = bitflyer_secret;
        var result2 = bitflyer_getOrder_(tid,productcode);
      }
    }catch(e){
      if(!result2){
        if(tid == "undefined"){
          order_delete_("undefined");
        }
        errorcount = Number(errorcount) + 1;
        order_errorcount_(tid,errorcount);
        if(errorcount >= errorcount_upperlimit){
          message = strategy + ": errorcount is over" + errorcount_upperlimit;
          sendMessage_(message);
          if(exchange == "bitflyer"){
            var tid0 = tid;
            var outstanding = Number(volume);
            tid = bitflyer_sendOrder_(productcode,position,outstanding,order_type);
            if(tid){
              order_delete_(tid0);
              order_insert_(time,productcode,price,position,strategy,volume,outstanding,exchange,tid);
            }
          }
        }else{
          if(exchange == "bybit" || exchange == "bybit_testnet"){
            var tid0 = tid;
            var outstanding = Number(volume);
            tid = bybit_sendOrder_(productcode,position,outstanding,exchange,order_type);
            if(tid){
              order_delete_(tid0);
              order_insert_(time,productcode,price,position,strategy,volume,outstanding,exchange,tid);
            }
          }
        }
        continue;
      }
    }
    
    var ordStatus = result2[0];
    outstanding = Number(result2[1]);
    time = result2[2];
    
    //orderの更新
    var totalvolume,message,memo,response;
    
    try{
      if(ordStatus == "ACTIVE" || ordStatus == "REJECTED"  || ordStatus == "EXPIRED" || ordStatus == "New" || ordStatus == "Rejected" || ordStatus == "Partially Filled" || ordStatus == "Canceled"){
        var tid0 = tid;
        if(exchange == "bybit" || exchange == "bybit_testnet"){
          if((ordStatus == "New" || ordStatus == "PartiallyFilled") & outstanding > 0){
            //bybit_PriceUpdate_(productcode,position,exchange,tid);
            return;
          }else if(ordStatus == "Rejected"){
            tid = bybit_sendOrder_(productcode,position,outstanding,exchange,order_type);
            if(tid){
              order_delete_(tid0);
              order_insert_(time,productcode,price,position,strategy,volume,outstanding,exchange,tid);
            }
          }
        }else if(exchange == "bitflyer"){
          if(ordStatus == "ACTIVE"){
            return;
          }else if(ordStatus == "EXPIRED" & outstanding > 0){
            tid = bitflyer_sendOrder_(productcode,position,outstanding,order_type);
            if(tid){
              order_delete_(tid0);
              order_insert_(time,productcode,price,position,strategy,volume,outstanding,exchange,tid);
            }
          }else if(ordStatus == "REJECTED"){
            tid = bitflyer_sendOrder_(productcode,position,outstanding,order_type);
            if(tid){
              order_delete_(tid0);
              order_insert_(time,productcode,price,position,strategy,volume,outstanding,exchange,tid);
            }        
          }
        }
      }else if(ordStatus == "COMPLETED" || ordStatus == "Filled"){
        order_delete_(tid);
        price = 0;
        
        [totalvolume,time] = history_insert_(time,productcode,price,position,strategy,volume,exchange,tid);
        
        if(exchange=="bitflyer"){
          totalvolume = Number(totalvolume).toFixed(4);
          volume = Number(volume).toFixed(4);
        }else if(exchange == "bybit" || exchange == "bybit_testnet"){
          totalvolume = Number(totalvolume).toFixed(0);
          volume = Number(volume).toFixed(0);
        }
        message = "===================\nTime:" + time + "\nStrategy:" + strategy + "\nPosition:" + position + "\nVolume:" + volume + "\nExchange:" + exchange + "\norder_type:" + order_type + "\ntotalVolume:" + totalvolume;
        sendMessage_(message);
        error_reset_(strategy,exchange);
      }else{
        errorcount = Number(errorcount) + 1;
        if(errorcount >= errorcount_upperlimit){
          message = strategy + ": errorcount is over " + errorcount_upperlimit;
          sendMessage_(message);
          if(exchange == "bitflyer"){
            var tid0 = tid;
            var outstanding = Number(volume);
            tid = bitflyer_sendOrder_(productcode,position,outstanding,order_type);
            if(tid){
              order_delete_(tid0);
              order_insert_(time,productcode,price,position,strategy,volume,outstanding,exchange,tid);
            }
          }else if(exchange == "bybit" || exchange == "bybit_testnet"){
            var tid0 = tid;
            var outstanding = Number(volume);
            tid = bybit_sendOrder_(productcode,position,outstanding,exchange,order_type);
            if(tid){
              order_delete_(tid0);
              order_insert_(time,productcode,price,position,strategy,volume,outstanding,exchange,tid);
            }
          }
        }else{
          order_errorcount_(tid,errorcount);
        }
      }
    }catch(e){
      //LINEにメッセージを送信する
      var time = Utilities.formatDate(new Date(), 'JST', "yyyy-MM-dd'T'HH:mm:ss.s");
      var message = strategy + "：" + time + "：" + e;
      sendMessage_(message);
      errorMessage_(e,strategy);
    }
  }
  lock.releaseLock();
}