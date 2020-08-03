var key;
var secret;
var minimumVolume = Number(bybit_minimumVolume);
var MAXTRYNUM = 60;

function retryWebhook_(){
  var lock = LockService.getScriptLock();

  //重複動作防止
  if(!lock.tryLock(55000)){
    console.log("end :locking Hamster");
    return;
  }

  var strategylist = [];

  // retry用のテーブルを準備
  var sheet = spreadSheet.getSheetByName('retry');
  var sheet_value = sheet.getDataRange().getValues();
  
  for(var i = sheet_value.length - 1; i>=1; i--){
        var strategy = String(sheet_value[i][0]);
        var position = sheet_value[i][1];
        var leverage = Number(sheet_value[i][2]) || 1.0;
        var memo = sheet_value[i][3];
        var trynum = Number(sheet_value[i][4]) || 1;

        var status = status_get_(strategy); //[strategy,active,productcode,volume,time,todoubles,exchange,order_type,lats]
        var active,productcode,raw_volume,volume,todoubles,exchange,order_type,lats;
        if(status){
          active = status[1]; //ON or OFF
          productcode = status[2];
          raw_volume = Number(status[3]);
          volume = raw_volume * Number(leverage); //bitflyerの場合0.01BTC以上、bybitの場合0.0025BTC以上
          todoubles = status[5];
          exchange = status[6];
          order_type = status[7];
        }else{
          sheet.deleteRow(i+1);
          continue;
        }

        //短時間重複取引チェック
        if(strategylist.indexOf(strategy) == -1){
          strategylist.push(strategy);
        }else{
          sheet.deleteRow(i+1);
          continue;
        };
    
        var productcodeFlag = false;
        var productcodeList = ["BTC","XBT","ETH","ADA","BCH","EOS","LTC","TRX","XRP","USD"];
        if(productcode){
          for (var k in productcodeList){
            if(productcode.match(productcodeList[k])){
              productcodeFlag = true;
              break;
            }
          }
          if(!productcodeFlag){
            sheet.deleteRow(i+1);
            sendMessage_("===================\nProductCode doesn't include 'BTC', 'XBT', 'ETH', 'ADA', 'BCH', 'EOS', 'LTC', 'TRX', 'XRP' or 'USD'");
            continue;
          }
        }
        console.log(active);
        console.log(position);
        if(active == ""){
          sheet.deleteRow(i+1);
          sendMessage_("\nStatus is undefined");
        }else if(position == "SON"){
          strategy_start_(strategy,exchange);
          sheet.deleteRow(i+1);
          sendMessage_("\nStrategy Activated: " + strategy);
        }else if(position == "SOFF"){
          strategy_stop_(strategy,exchange);
          sheet.deleteRow(i+1);
          sendMessage_("\nStrategy Deactivated: " + strategy);
        }else if(position == "BUYALERT" ||position == "SELLALERT"){
          sheet.deleteRow(i+1);
          message = "===================\nPosition:" + position + "\nStrategy:" + strategy + "\nMemo:" + memo + "\nExchange:" + exchange;
          sendMessage_(message);
        }else if(active.toUpperCase() == "ON"){
          var time, price, collateral, lastTradeInfo, message, tid;
          try{
            if(exchange=="bitflyer"){
              key = bitflyer_key;
              secret = bitflyer_secret;

              //bitflyer専用時刻確認
              time = Utilities.formatDate(new Date(), 'JST', "HH:mm");
              if(time >= "03:50" && time <= "04:13"){
                lock.releaseLock();
                if (trynum < MAXTRYNUM) {
                  sheet.getRange(i+1,1,1,5).setValues([[strategy,position,leverage,memo,trynum+1]]);
                } else {
                  message = "Retry MAXTRYNUM and delete.\n===================\nPosition:" + position + "\nStrategy:" + strategy + "\nMemo:" + memo + "\nExchange:" + exchange;
                  sheet.deleteRow(i+1);
                }
                continue;
              }

              //close対応
              if(position.toUpperCase() == "CLOSE"){
                lastTradeInfo = getLastTradeTotalVolume_(strategy);
                volume = Number(lastTradeInfo[0])*1.0;
                if(volume > 0){
                  position = "SELL"; 
                }else if(volume < 0){
                  position = "BUY";
                  volume = volume * -1.0;
                }else{
                  message = "===================\n" + strategy + " :totalvolume is already 0";
                  sendMessage_(message);
                  sheet.deleteRow(i+1);
                  continue;
                }
              }
              if(volume<0.01){
                volume = 0.01;
              }
              
              tid = bitflyer_sendOrder_(productcode,position,volume,order_type);

            }else if(exchange == "bybit" || exchange == "bybit_testnet"){
              if (volume >= minimumVolume){
                if(exchange == "bybit"){
                  key = bybit_key;
                  secret = bybit_secret;
                }else if(exchange == "bybit_testnet"){
                  key = bybit_testnet_key;
                  secret = bybit_testnet_secret;
                }

                //close対応
                if(position.toUpperCase() == "CLOSE"){
                  lastTradeInfo = getLastTradeTotalVolume_(strategy);
                  volume = Number(lastTradeInfo[0]);
                  if(volume > 0.0){
                    position = "SELL"; 
                  }else if(volume < 0.0){
                    position = "BUY";
                    volume = volume * -1.0;
                  }else if(volume == 0.0){
                    message = "===================\n" + strategy + " :totalvolume is already 0";
                    sendMessage_(message);
                    sheet.deleteRow(i+1);
                    continue;
                  }
                }
                if(volume < minimumVolume){
                  volume = Number(minimumVolume);
                }
                console.log(productcode);
                console.log(position);
                console.log(volume);
                console.log(exchange);
                console.log(order_type);
                tid = bybit_sendOrder_(productcode,position,volume,exchange,order_type);
              }else{
                sendMessage_("===================\nThe bot should never send an order with volume < $" + minimumVolume);
                message = "***" + strategy + "***を強制停止します";
                strategy_stop_(strategy,exchange);    
                sendMessage_(message);
              }
            }else{
              sendMessage_("===================\nExchange is wrong:" + exchange);
            }
            
            console.log(tid);
            if (tid){
              price = 0;
              time = Utilities.formatDate(new Date(), 'JST', "yyyy-MM-dd'T'HH:mm:ss.sss");
              sheet.deleteRow(i+1);
              todoubles_increase_(todoubles,raw_volume,strategy,exchange);
              var totalvolume,outstanding;
              try{
                if(order_type.toUpperCase() == "MARKET"){
                  [totalvolume,time] = history_insert_(time,productcode,price,position,strategy,volume,exchange,tid);
                  if(totalvolume){
                    if(exchange=="bitflyer"){
                      totalvolume = Number(totalvolume).toFixed(4);
                      volume = Number(volume).toFixed(4);
                    }else if(exchange == "bybit" || exchange == "bybit_testnet"){
                      totalvolume = Number(totalvolume).toFixed(0);
                      volume = Number(volume).toFixed(0);
                    }
                    console.log(totalvolume);
                    console.log(time);
                    console.log(volume);
                    message = "===================\nTime:" + time + "\nStrategy:" + strategy + "\nPosition:" + position + "\nVolume:" + volume + "\nMemo:" + memo + "\nExchange:" + exchange + "\norder_type:" + order_type + "\nLats:" + lats + "\ntotalVolume:" + totalvolume;
                    sendMessage_(message);
                    error_reset_(strategy,exchange);
                  }
                }else if(order_type.toUpperCase() == "LIMIT"){
                  outstanding = Number(volume);
                  order_insert_(time,productcode,price,position,strategy,volume,outstanding,exchange,tid);
                }
              }catch(e){
                time = Utilities.formatDate(new Date(), 'JST', "yyyy-MM-dd'T'HH:mm:ss.sss");
                message = strategy + "：" + e;
                sendMessage_(message);
                errorMessage_(e,strategy,exchange);
              }
            }
          }catch(e){
            if (trynum < MAXTRYNUM) {
              sheet.getRange(i+1,1,1,5).setValues([[strategy,position,leverage,memo,trynum+1]]);
            } else {
              "Retry MAXTRYNUM and delete.\n===================\nPosition:" + position + "\nStrategy:" + strategy + "\nMemo:" + memo + "\nExchange:" + exchange;
              sheet.deleteRow(i+1);
            }
            var time = Utilities.formatDate(new Date(), 'JST', "yyyy-MM-dd'T'HH:mm:ss.sss");
            var message = "===================\n" + strategy + "：" + time + "：" + e;
            sendMessage_(message);
            errorMessage_(e,strategy,exchange);
          }
        }else{
          sheet.deleteRow(i+1);
        }
  }
  lock.releaseLock();
}