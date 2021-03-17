var key;
var secret;

function checkExchangePositions_() {
  totalPositions = getTotalPositions_();
  for (var exchange in totalPositions) {
    for (var productcode in totalPositions[exchange]) {
      if (!(checkExchangePositionsSettings[exchange][productcode] || false)) {
        continue;
      }
      var localPosition = totalPositions[exchange][productcode];
      var exchangePosition = undefined;
      if (exchange == 'bitflyer') {
        key = bitflyer_key;
        secret = bitflyer_secret;
        if (productcode == 'FX_BTC_JPY') {
          exchangePosition = bitflyer_getPositions_(productcode);
        } else {
          exchangePosition = bitflyer_getBalance_(productcode);
        }
      } else if(exchange == "bybit"){
        key = bybit_key;
        secret = bybit_secret;
        exchangePosition = bybit_getPositions_(exchange, productcode);
      }else if(exchange == "bybit_testnet"){
        key = bybit_testnet_key;
        secret = bybit_testnet_secret;
        exchangePosition = bybit_getPositions_(exchange, productcode);
      } else {
        console.log("unknown exchange.");
        continue;
      }
      
      if (typeof exchangePosition === "undefined") {
        console.log("fetch failed. [exchange][" + exchange + "][productcode][" + productcode + "]");
        continue;
      }
      
      if (Math.abs(localPosition - exchangePosition) > 1e-5) {
        sendMessage_("CHECK EXCHANGE POSITIONS FAILED! [productcode][" + productcode + "][hamtore][" + localPosition + "][" + exchange + "][" + exchangePosition + "]");
      }
    }
  }
}

function getTotalPositions_(){
  var status = spreadSheet.getSheetByName('history');
  var data = status.getDataRange().getValues();
  
  var totalVolumes = {};
  for (var i=1; i<data.length; i++){
    var prodcode = String(data[i][1]);
    var strategy = String(data[i][4]);
    var exchange = String(data[i][6]);
    var volume = Number(data[i][10]) || 0.0;
    if (!totalVolumes[exchange]) {
      totalVolumes[exchange] = {};
    }
    if (!totalVolumes[exchange][prodcode]) {
      totalVolumes[exchange][prodcode] = {};
    }
    totalVolumes[exchange][prodcode][strategy] = volume;
  }
  
  var ret = {};
  for (var exchange in totalVolumes) {
    for (var prodcode in totalVolumes[exchange]) {
      var totalVolume = 0.0;
      for (var strategy in totalVolumes[exchange][prodcode]) {
        totalVolume += totalVolumes[exchange][prodcode][strategy];
      }
      if (!ret[exchange]) {
        ret[exchange] = {};
      }
      ret[exchange][prodcode] = totalVolume;
    }
  }

  return ret;
}