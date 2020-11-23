function errorMessage_(e,strategy,exchange){
  if(e.message.match("Margin") || e.message.match("margin") || e.message.match("Account") ||
     e.message.match("account") || e.message.match("Invalid") ||
     e.message.match("type") || e.message.match("direction") || e.message.match("タイムアウト") ||
     e.message.match("Over API limit per minute") || e.message.match("Under maintenance") ||
     e.message.match("100") || e.message.match("101") || e.message.match("102") ||
     e.message.match("103") || e.message.match("104") || e.message.match("105") ||
     e.message.match("106") || e.message.match("107") || e.message.match("115") ||
     e.message.match("125") || e.message.match("153") || 
     e.message.match("203") || e.message.match("205") ||
     e.message.match("401") || e.message.match("402") || (e.message.match("403") & !e.message.match("Forbidden")) ||
     e.message.match("404") || e.message.match("429") ||
     e.message.match("501") || e.message.match("502") || e.message.match("508")){
       error = get_error_(strategy,exchange);       
       if(!error || isNaN(error)){
         var error = 0;
       };
       error = Number(error) + 1;
       var message = "***" + strategy + "***緊急停止カウントダウン " + error;
       sendMessage_(message);
       if(error >= 10){
         var message = "***" + strategy + "***を強制停止します";
         strategy_stop_(strategy,exchange);    
         sendMessage_(message);
         order_error_(strategy,exchange,0);
         if (AlertMailAddress != ""){
           MailApp.sendEmail(AlertMailAddress, "Hamster Critical Error", message);
         }
       }else{
         order_error_(strategy,exchange,error);
       }
     }
}

function get_error_(strategy,exchange){
  if(exchange == "bitflyer"){
    var status_sheet = spreadSheet.getSheetByName('status_bitflyer');
  }else if(exchange == "bybit" || exchange == "bybit_testnet"){
    var status_sheet = spreadSheet.getSheetByName('status_bybit');
  }
  var status = status_sheet.getDataRange().getValues();

  //statustableにない場合、終了
  if (!status){
    return;
  }

  var error;
  for(var i=1;i<status.length;i++){
    if(String(status[i][0]) === strategy){
      error = status[i][9]; // Error
      break;
    }
  }

  return error;
}

function order_error_(strategy,exchange,error){
  if(exchange == "bitflyer"){
    var status_sheet = spreadSheet.getSheetByName('status_bitflyer');
  }else if(exchange == "bybit" || exchange == "bybit_testnet"){
    var status_sheet = spreadSheet.getSheetByName('status_bybit');
  }
  var status = status_sheet.getDataRange().getValues();
  for(var i=1;i<status.length;i++){
    if(String(status[i][0]) === strategy){
      status[i][9] = error;//Error
      status_sheet.getRange(i+1,1,1,status[i].length).setValues([status[i]]);
      break;
    }
  }
}

function error_reset_(strategy,exchange){
  if(exchange == "bitflyer"){
    var status_sheet = spreadSheet.getSheetByName('status_bitflyer');
  }else if(exchange == "bybit" || exchange == "bybit_testnet"){
    var status_sheet = spreadSheet.getSheetByName('status_bybit');
  }
  var status = status_sheet.getDataRange().getValues();
  for(var i=1;i<status.length;i++){
    if(String(status[i][0]) === strategy){
      status[i][9] = 0;//Error
      status_sheet.getRange(i+1,1,1,status[i].length).setValues([status[i]]);
      break;
    }
  }
}