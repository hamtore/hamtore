function getSheetTest(){  
  var sheet,data,message;
  try{
    sheet = spreadSheet.getSheetByName('status_bitflyer');
    data = sheet.getDataRange().getValues();
    if(data){
      message = "status_bitflyer取得成功"
    }
  }catch(e){
    message = "status_bitflyer取得失敗"
  }
  console.log(message);
  sendMessage_(message);

  try{
    sheet = spreadSheet.getSheetByName('status_bybit');
    data = sheet.getDataRange().getValues();
    if(data){
      message = "status_bybit取得成功"
    }
  }catch(e){
    message = "status_bybit取得失敗"
  }
  console.log(message);
  sendMessage_(message);

  try{  
    sheet = spreadSheet.getSheetByName('order');
    data = sheet.getDataRange().getValues();
    if(data){
      message = "order取得成功"
    }
  }catch(e){
    message = "order取得失敗"
  }
  console.log(message);
  sendMessage_(message);
  
  try{
    sheet = spreadSheet.getSheetByName('history');
    data = sheet.getDataRange().getValues();
    if(data){
      message = "history取得成功"
    }
  }catch(e){
    message = "history取得失敗"
  }
  console.log(message);
  sendMessage_(message);  
}
