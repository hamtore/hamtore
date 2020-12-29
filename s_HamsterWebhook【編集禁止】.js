// webhook
var key;
var secret;
var minimumVolume = Number(bybit_minimumVolume);
var regex = new RegExp(/^{{.+}}$/);
var remessage = new RegExp(/^(strategy|\[strategy\]|\[st\]|\[ST\])?([^ :]+).*:.+ (buy|sell|buyalert|sellalert) @ (-?\d+) .+ (-?\d+).*$/);
var MAXTRYNUM = 720;

function doPost(e){
  // contextを受け取る
  var message = e.postData.getDataAsString();
  
  var ret = interpretMessage_(message);
  var strategy = ret[0];
  var position = ret[1];
  var leverage = ret[2];
  var memo = ret[3];
  var position_size = ret[4];
  
  if(createOrder_(strategy, position, leverage, memo, position_size) == Status.retry){
    insertRetry_([message,1]);
  }
}


function retryWebhook_(){
  var lock = LockService.getScriptLock();

  //重複動作防止
  if(!lock.tryLock(55000)){
    console.log("end :locking retryWebhook");
    return;
  }

  // retry用のテーブルを準備
  var sheet = spreadSheet.getSheetByName('retry');
  var sheet_value = sheet.getDataRange().getValues();
  
  var strategylist = [];
  for(var i = sheet_value.length - 1; i>=1; i--){
    var message = sheet_value[i][0];
    var trynum = Number(sheet_value[i][1]) || 1;
    
    var ret = interpretMessage_(message);
    var strategy = ret[0];
    var position = ret[1];
    var leverage = ret[2];
    var memo = ret[3];
    var position_size = ret[4];
    
    //短時間重複取引チェック
    if(strategylist.indexOf(strategy) == -1){
      strategylist.push(strategy);
      if(createOrder_(strategy, position, leverage, memo, position_size) == Status.retry && trynum < MAXTRYNUM){
        sheet.getRange(i+1,1,1,2).setValues([[message,trynum+1]]);
        // do not remove row
        continue;
      }
    }
    sheet.deleteRow(i+1);
  }
  lock.releaseLock();
}


function insertRetry_(values) {
  var lock = LockService.getScriptLock()
  if (lock.tryLock(10000)) {
    try {
      var sheet = spreadSheet.getSheetByName('retry');
      sheet.appendRow(values);
    }catch(e){
      sendMessage_(e);
    }finally{
      lock.releaseLock();
    }
  }else{
    sendMessage_("write retry failed because of lock.");
  }
}