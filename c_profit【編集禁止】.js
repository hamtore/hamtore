var profitTestStrategy = ""; //テストしたいストラテジー名

function setProfit_() {
  var status = spreadSheet.getSheetByName('history');
  var data = status.getDataRange().getValues();
  var result = [];

  for(var i=1;i<data.length;i++){
    if(data[i][2] > 0 && data[i][8] === ""){//Price > 0 & Profit = ""
      result.push(data[i]);
    }
  }
  result.sort();
  Logger.log(result);

  var beforeStrategy = "";
  var totalVolume = 0;
  var averagePrice = 0;
  var max = 40;
  try{
    var len = result.length;
    if(len < max){
      max = len;
    }
  }catch(e){
    throw new Error("Cannot read property");
    return;
  }

  for (var i = 0; i < max; i++) {
    var profit = 0;
    var productcode = result[i][1];
    var price =  Number(result[i][2]);
    var position =  result[i][3];
    var strategy = String(result[i][4]);
    var volume = Number(result[i][5]);
    var exchange = result[i][6];
    var id = result[i][7];
    
    totalVolume = Number(totalVolume);
    averagePrice = Number(averagePrice);
    
    if(position == "SELL"){
      volume = Number(-1.0 * Number(volume));
    }

    //ストラテジーが変わったか確認
    if(strategy != beforeStrategy){
      var lastTradeInfo = getLastTradeInfo_(strategy);
      Logger.log(lastTradeInfo);
      averagePrice = Number(lastTradeInfo[0]);
      totalVolume = Number(lastTradeInfo[1]);
      beforeStrategy = strategy;
    }
        
    // 収益計算
    if((totalVolume * 10000 + volume * 10000) == 0){
      //ノーポジ化
      if(exchange == "bitflyer"){
        profit = Number((averagePrice-price) * volume);
      }else if(exchange == "bybit" || exchange == "bybit_testnet"){
        profit = Number((averagePrice-price) * volume / averagePrice);
      }
      averagePrice = 0.0;
    }else if(totalVolume == 0 && volume != 0){
      //ノーポジ+買い or ノーポジ+売り
      averagePrice = Number(price);
    }else if(totalVolume > 0 && volume > 0 || totalVolume < 0 && volume < 0){
      //買いポジ＋買い or 売りポジ＋売り
      averagePrice = Number((totalVolume * averagePrice + volume * price) / (totalVolume + volume));
    }else{
      //買いポジ＋売り or 売りポジ＋買い
      if(Math.abs(totalVolume) > Math.abs(volume)){
        //ノーポジの瞬間なし
        if(exchange == "bitflyer"){
          profit = Number((averagePrice-price) * volume);
        }else if(exchange == "bybit" || exchange == "bybit_testnet"){
          profit = Number((averagePrice-price) * volume / averagePrice);          
        }
      }else{
        //ノーポジの瞬間あり
        //売りポジ＋買い or 買いポジ＋売り        
        if(exchange == "bitflyer"){
          profit = Number((price-averagePrice) * totalVolume);
        }else if(exchange == "bybit" || exchange == "bybit_testnet"){
          profit = Number((price-averagePrice) * totalVolume / averagePrice);          
        }
        averagePrice = Number(price);
      }
    }

    //下桁捨て
    if(exchange == "bitflyer"){
      profit = Number(profit).toFixed(2);
      totalVolume = Number(totalVolume)+Number(volume);
      totalVolume = Number(totalVolume).toFixed(5);
      averagePrice = Number(averagePrice).toFixed(1);
    }else if(exchange == "bybit" || exchange == "bybit_testnet"){
      profit = Number(profit).toFixed(2);
      totalVolume = Number(totalVolume)+Number(volume);
      totalVolume = Number(totalVolume).toFixed(0);
      averagePrice = Number(averagePrice).toFixed(1);   
    }
    
    Logger.log(strategy);
    Logger.log(position);
    Logger.log(volume);
    Logger.log(totalVolume);
    Logger.log(profit);

    //UPDATE
    var status = spreadSheet.getSheetByName('history');
    var data = status.getDataRange().getValues();
    for(var j=1;j<data.length;j++){
      if(data[j][7] === id){//ID
        data[j][8] = profit;
        data[j][9] = averagePrice;
        data[j][10] = totalVolume;
        status.getRange(j+1,1,1,data[j].length).setValues([data[j]]);
        break;
      }
    }
    Utilities.sleep(1000);
  }
}

//profitが入っている最後のhistoryを取得
//return [AveragePrice, TotalVolume]
function getLastTradeInfo_(strategyName){
  var status = spreadSheet.getSheetByName('history');
  var data = status.getDataRange().getValues();
  var result = [];
  for(var i=1;i<data.length;i++){
    Logger.log(data[i][9]);
    if(String(data[i][4]) === strategyName && data[i][9] !== ""){//Strategy & averagePrice = ""
      result.push(data[i]);
    }
  }
  result.sort();
  if (typeof result[0] == "undefined" || result[0] == "NaN"){
    return [0,0];
  }

  return [result[result.length - 1][9],result[result.length - 1][10]];
}

//totalvolumeが入っている最後のhistoryを取得
//return [TotalVolume]
function getLastTradeTotalVolume_(strategyName){
  var status = spreadSheet.getSheetByName('history');
  var data = status.getDataRange().getValues();
  var result = [];
  for(var i=1;i<data.length;i++){
    if(String(data[i][4]) === strategyName && data[i][10] !== ""){//Strategy
      result.push(data[i]);
    }
  }
  result.sort();
  if (typeof result[0] === "undefined" || result[0] == "NaN"){
    return [0];
  }

  return [result[result.length-1][10]];
}

function profitReset() {
  var status = spreadSheet.getSheetByName('history');
  var data = status.getDataRange().getValues();
  for(var i=1;i<data.length;i++){
    data[i][8] = "";
    data[i][9] = "";
    data[i][10] = "";
    status.getRange(i+1,1,1,data[i].length).setValues([data[i]]);
  }
}
