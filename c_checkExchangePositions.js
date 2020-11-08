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
        sendMessage_("CHECK EXCHANGE POSITIONS FAILED! [productcode][ " + productcode + "][hamtore][" + localPosition + "][" + exchange + "][" + exchangePosition + "]");
      }
    }
  }
}

function getTotalPositions_(){
  var ret = {};

  // bybit
  var status_sheet_bybit = spreadSheet.getSheetByName('status_bybit');
  var status_bybit = status_sheet_bybit.getDataRange().getValues();
  for (var i=1;i<status_bybit.length;i++){
    if (status_bybit[i][1] != 'ON') {
      // skip not working strategy
      continue;
    }
    var prodcode = status_bybit[i][2];
    var exchange = status_bybit[i][6];
    var possize = Number(status_bybit[i][10]) || 0;
    if (!ret[exchange]) {
      ret[exchange] = {};
      ret[exchange][prodcode] = possize;
    } else if (!ret[exchange][prodcode]) {
      ret[exchange][prodcode] = possize;
    } else {
      ret[exchange][prodcode] = possize + ret[exchange][prodcode];
    }
  }
  
  // bitflyer
  var status_sheet_bitflyer = spreadSheet.getSheetByName('status_bitflyer');
  var status_bitflyer = status_sheet_bitflyer.getDataRange().getValues();
  for (var i=1;i<status_bitflyer.length;i++){
    if (status_bitflyer[i][1] != 'ON') {
      // skip not working strategy
      continue;
    }
    var prodcode = status_bitflyer[i][2];
    var exchange = status_bitflyer[i][6];
    var possize = Number(status_bitflyer[i][10]) || 0;
    if (!ret[exchange]) {
      ret[exchange] = {};
      ret[exchange][prodcode] = possize;
    } else if (!ret[exchange][prodcode]) {
      ret[exchange][prodcode] = possize;
    } else {
      ret[exchange][prodcode] = possize + ret[exchange][prodcode];
    }
  }

  return ret;
}