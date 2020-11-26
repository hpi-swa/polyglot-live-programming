const textArea = 'webViewText'

window.addEventListener('message', event => {

    const message = event.data;

    var oldContent = document.getElementById(textArea)!.innerHTML;

    if (message.example) {
        var newContent = oldContent + message.example + '(Should be on line:' +  message.line + ')';
        document.getElementById(textArea)!.innerHTML = newContent;
    }
    if (message.probe) {
        var newContent = oldContent + message.probe + '(Should be on line:' +  message.line + ')';
        document.getElementById(textArea)!.innerHTML = newContent;
    }
});
