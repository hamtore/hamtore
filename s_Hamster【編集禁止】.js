var key;
var secret;
var minimumVolume = Number(bybit_minimumVolume);
var regex = new RegExp(/^{{.+}}$/);
var remessage = new RegExp(/^(strategy|\[strategy\]|\[st\]|\[ST\])?([^ :]+).*:.+ (buy|sell|buyalert|sellalert) @ (-?\d+) .+ (-?\d+).*$/);

function Hamster_(){
  var lock = LockService.getScriptLock();

  //重複動作防止
  if(!lock.tryLock(55000)){
    console.log("end :locking Hamster");
    return;
  }

  //受信トレイにあり、件名にTradingViewを含む場合のみ動作。先頭スレッド10件のみ検索。
  var FindSubject = 'subject:({Alert: アラート:}) in:inbox';
  var myThreads = GmailApp.search(FindSubject, 0, 10);
  var myMessages = GmailApp.getMessagesForThreads(myThreads);

  var strategylist = [];

  for(var i in myMessages){
    for(var j in myMessages[i]){
      if(!myMessages[i][j].isStarred()){
        var strDate = myMessages[i][j].getDate();
        var strSubject = myMessages[i][j].getSubject();
        var strMessage = myMessages[i][j].getPlainBody().slice(0,200);
        
        var strategy;
        var position;
        var leverage;
        var memo;
        var position_size;
        
        m = remessage.exec(strSubject);
        if (m) { // default strategy alert message
          strategy = m[2];
          position = m[3].toUpperCase();
          leverage = Number(parseInt(m[4]));
          memo = strSubject;
          position_size = Number(parseInt(m[5]));
        } else { // custom alert message
          var ary = strSubject.split(',');
          strategy = ary[1];
          position = Number(parseInt(ary[2])) || ary[2];
          leverage = Number(parseInt(ary[3])) || 1.0;
          memo = ary[4];
          
          //position変換
          if(position == 1){
            position = "BUY";
          }else if(position == -1){
            position = "SELL";
          }else if(position == 0){
            position = "CLOSE";
          }else if(position == 100){
            position = "BUYALERT";
          }else if(position == -100){
            position = "SELLALERT";
          }else if(Number(position)){
            sendMessage_("invalid position code.");
            return;
          }else if(regex.test(position)) {
            sendMessage_("position variable may not be expanded. please use pine script v4");
            return;
          }
        }

        //短時間重複取引チェック
        if(strategylist.indexOf(strSubject) == -1){
          strategylist.push(strSubject);
        }else{
          myMessages[i][j].star();      
          myMessages[i][j].moveToTrash();
          continue;
        };

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
          continue;
        }

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
            myMessages[i][j].star();
            myMessages[i][j].moveToTrash();
            sendMessage_("===================\nProductCode doesn't include 'BTC', 'XBT', 'ETH', 'ADA', 'BCH', 'EOS', 'LTC', 'TRX', 'XRP' or 'USD'");
            continue;
          }
        }
        console.log(active);
        console.log(position);
        if(active == ""){
          myMessages[i][j].star();
          myMessages[i][j].moveToTrash();
          sendMessage_("\nStatus is undefined");
        }else if(position == "SON"){
          strategy_start_(strategy,exchange);
          myMessages[i][j].star();
          myMessages[i][j].moveToTrash();
          sendMessage_("\nStrategy Activated: " + strategy);
        }else if(position == "SOFF"){
          strategy_stop_(strategy,exchange);
          myMessages[i][j].star();    
          myMessages[i][j].moveToTrash();
          sendMessage_("\nStrategy Deactivated: " + strategy);
        }else if(position == "BUYALERT" ||position == "SELLALERT"){
          myMessages[i][j].star();
          myMessages[i][j].moveToTrash();
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
                  myMessages[i][j].star();
                  myMessages[i][j].moveToTrash();                  
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
                    myMessages[i][j].star();    
                    myMessages[i][j].moveToTrash();                  
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
              myMessages[i][j].star();
              myMessages[i][j].moveToTrash();
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
                    if(position_size != undefined){
                      var tvtotalvolume = position_size * raw_volume;
                      if(todoubles == 'ON'){
                        tvtotalvolume = tvtotalvolume * 2;
                      }
                      if (totalvolume != tvtotalvolume){
                        sendMessage_("MISMATCHED POSITION SIZE DETECTED!\n" + strategy + "'s totalVolume [tv][" + tvtotalvolume + "][hamtore][" + totalvolume + "]")
                      }
                    }
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
            var time = Utilities.formatDate(new Date(), 'JST', "yyyy-MM-dd'T'HH:mm:ss.sss");
            var message = "===================\n" + strategy + "：" + time + "：" + e;
            sendMessage_(message);
            errorMessage_(e,strategy,exchange);
          }
        }else{
          myMessages[i][j].star();
          myMessages[i][j].moveToTrash();
        }
      }
    }
  }
  lock.releaseLock();
}