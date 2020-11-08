// script property
property = PropertiesService.getScriptProperties();

//TableId
var spreadSheetID = "" || property.getProperty("SPREAD_SHEET_ID");//spreadSheet用
var spreadSheet = SpreadsheetApp.openById(spreadSheetID);

//Notification
var LineToken = "" || property.getProperty("LINE_TOKEN");//LINENotify用
var DiscordUrl = "" || property.getProperty("DISCORD_URL");//Discord用
var AlertMailAddress = "" || property.getProperty("ALERT_MAIL_ADDRESS");//Alert Mail用(重大エラー通知)

//bitFlyer
var bitflyer_key = "" || property.getProperty("BITFLYER_KEY");//bitflyer_API_key
var bitflyer_secret = "" || property.getProperty("BITFLYER_SECRET");//bitflyer_secret_key

//Bybit
var bybit_key = "" || property.getProperty("BYBIT_KEY");//bybit_API_key
var bybit_secret = "" || property.getProperty("BYBIT_SECRET");//bybit_secret_key

//Bybit testnet
var bybit_testnet_key = "" || property.getProperty("BYBIT_TESTNET_KEY");//bybit_testnet_API_key
var bybit_testnet_secret = "" || property.getProperty("BYBIT_TESTNET_SECRET");//bybit_testnet_secret_key

//Boost Mode
var BoostMode = "OFF";//ON or OFF

//Bybit minimum volume
var bybit_minimumVolume = 1.0;

// checkExchangePositions settings
var checkExchangePositionsSettings = {
  'bybit': {'BTCUSD': false, 'ETHUSD': false, 'EOSUSD': false, 'XRPUSD': false},
  'bybit_testnet': {'BTCUSD': false, 'ETHUSD': false, 'EOSUSD': false, 'XRPUSD': false},
  'bitflyer': {'BTC_JPY': false, 'FX_BTC_JPY': true, 'ETH_BTC': false, 'BCH_BTC': false}
};