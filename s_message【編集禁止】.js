function sendMessage_(message){
  try{
    sendMessageToLine_(message);
  }catch(e){
    console.log("Notification Error: LINE\n" + e);
  }
  try{
    sendMessageToDiscord_(message);
  }catch(e){
    console.log("Notification Error: Discord\n" + e);  
  }
  try{
    sendMessageToEmail_(message);
  }catch(e){
    console.log("Notification Error: Email\n" + e);  
  }
}

//メッセージをLineに送信
function sendMessageToLine_(message){
  if (LineToken == ""){
    return;
  }
  var options =
      {
        "method"  : "post",
        "payload" : "message=" + message,
        "headers" : {"Authorization" : "Bearer "+ LineToken}
  };
  UrlFetchApp.fetch("https://notify-api.line.me/api/notify",options);
}

//メッセージをDiscordに送信
function sendMessageToDiscord_(message){
  if (DiscordUrl == ""){
    return;
  }

  const url = DiscordUrl;//discordのwebhooksのurl
  const payload = JSON.stringify({content: message});
  const params = {
    headers: {
      'Content-Type': 'application/json'
    },
    'method' : 'post',
    'payload' : payload,
    'muteHttpExceptions': true    
  };

  UrlFetchApp.fetch(url, params);
}

function sendMessageToEmail_(message){
  if (AlertMailAddress === ""){
    return;
  }
  MailApp.sendEmail(AlertMailAddress, "はむとれ通知", message);
}