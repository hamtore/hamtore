function setTrigger_(){
  deleteTrigger_();
  var count;
  if(BoostMode == "ON"){
    count = 3;
  }else{
    count = 1;
  }
  var trigger = ScriptApp.newTrigger("historyUpdater").timeBased().everyHours(4).create();
  var trigger = ScriptApp.newTrigger("checkExchangePositions").timeBased().everyHours(12).create();
  for(var i=1 ;i <= count ; i++){
    var seconds = Utilities.formatDate(new Date(), 'JST', "ss");
    var start = Utilities.formatDate(new Date(), 'JST', 'yyyy/MM/dd/HH:mm:sss');
    var trigger = ScriptApp.newTrigger("Hamster").timeBased().everyMinutes(1).create();
    var trigger = ScriptApp.newTrigger("HamsterLimit").timeBased().everyMinutes(1).create();
    var trigger = ScriptApp.newTrigger("retryWebhook").timeBased().everyMinutes(1).create();
    var trigger_id = trigger.getUniqueId();
    var end = Utilities.formatDate(new Date(), 'JST', 'yyyy/MM/dd/HH:mm:ss');
  }
}

function deleteTrigger_() {
  var triggers = ScriptApp.getProjectTriggers();
  for(var i=0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() != "setTrigger"){
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }
}