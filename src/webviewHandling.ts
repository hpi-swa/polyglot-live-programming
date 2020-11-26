var textArea = 'webViewText'

window.addEventListener('message', event => {

    const message = event.data;

    var oldContent = document.getElementById(textArea)!.innerHTML;

    if (message.example) {
    //addLine(message.probe, message.line)
    var spaces = '';
    for (var x = 1; x <= message.line; x++) {
        spaces = spaces.concat('\n');
    }
    var newContent = oldContent + spaces + message.example + '(Should be on line:' +  message.line + ')';
    }
    if (message.probe) {
    //addLine(message.probe, message.line)
    var spaces = '';
    for (var x = 0; x <= message.line; x++) {
        spaces = spaces.concat('\n');
    }
    //var newContent = oldContent + spaces + message.probe + '(Should be on line:' +  message.line + ')';
    var newContent = oldContent + message.probe + '(Should be on line:' +  message.line + ')';
    document.getElementById(textArea)!.innerHTML = newContent;
    }
});
