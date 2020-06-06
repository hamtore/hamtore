//自動取引用　トリガー設定要
function Hamster(){
  Hamster_();
}

//指値注文取引用　トリガー設定要
function HamsterLimit(){
  hamsterlimit_();
}

//自動取引用　トリガー設定要
function historyUpdater(){
  historyUpdater_();
}

//Webhook Retry　トリガー設定要
function retryWebhook() {
  retryWebhook_();
}

//Hamsterトリガー自動設定用　トリガーセット不要
function TriggerSetting(){
  setTrigger_();
}

//緊急停止
function emergency(){
  emergency_stop_();
}