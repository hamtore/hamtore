function historyUpdater(){
  var message;
  var time = Utilities.formatDate(new Date(), 'JST', "yyyy-MM-dd'T'HH:mm:ss.sss");
  try{
    bitflyer_DatabaseUpdater_();
  }catch(e){
    if(!e.message.match("Cannot read property") && !e.message.match("Key or secret key is empty")){
      message = "bitflyer_DatabaseUpdater：\n" + time + "：\n" + e;
      sendMessage_(message);  
    }
  }

  time = Utilities.formatDate(new Date(), 'Asia/Tokyo', "yyyy-MM-dd'T'HH:mm:ss.sss");  
  try{
    bybit_DatabaseUpdater_();
  }catch(e){
    if(!e.message.match("Cannot read property") && !e.message.match("Key or secret key is empty")){
      message = "bybit_DatabaseUpdater：\n" + time + "：\n" + e;
      sendMessage_(message);
    }
  }

  time = Utilities.formatDate(new Date(), 'Asia/Tokyo', "yyyy-MM-dd'T'HH:mm:ss.sss");    
  try{
    bybit_testnet_DatabaseUpdater_();
  }catch(e){
    if(!e.message.match("Cannot read property") && !e.message.match("Key or secret key is empty")){
      message = "bybit_testnet_DatabaseUpdater：\n" + time + "：\n" + e;
      sendMessage_(message);
    }
  }
  
  time = Utilities.formatDate(new Date(), 'Asia/Tokyo', "yyyy-MM-dd'T'HH:mm:ss.sss");  
  try{
    setProfit_();
  }catch(e){
    if(!e.message.match("Cannot read property")){
      message = "setProfit：\n" + time + "：\n" + e;
      sendMessage_(message);  
    }
  }
  
}