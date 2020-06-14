function getPropertiesTest(){
  variables = [
    "LineToken", 
    "DiscordUrl",
    "AlertMailAddress",
    "bitflyer_key",
    "bitflyer_secret",
    "bybit_key", 
    "bybit_secret",
    "bybit_testnet_key",
    "bybit_testnet_secret"
  ]
  
  message = ""
  for (i=0; i<variables.length; i++) {
    message += variables[i] + (eval(variables[i]) ? " exists." : " do not exists") + "\n"
  }
  console.log(message);
  sendMessage_(message);
}
