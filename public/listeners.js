socket.on('connect', () => {
    app.connected = true;
    console.log('socket connected');
    //app.toast(`Hello👋 ${app.nick}`);
});

socket.on('disconnect', () => {
    console.log('socket disconnected');
    app.connected = false;
});

socket.on('new mes toc', (data) => {
    app.addMessage(data);
});

socket.on('typing toc', (data) => {
    app.addTypingStatus(data.nick);
});

socket.on('no typing toc', (data) => {
    app.removeTypingStatus(data.nick);
});

socket.on('add user toc', (data) => {
    app.numUser = data.numUser;
    if(data.nick !== app.nick)
        app.toast(`${data.nick} joined 😀`);

    //console.log('add user toc', data);
});

socket.on('user left toc', (data) => {
    app.numUser = data.numUser;
    app.toast(`${data.nick} left 🙁`);
    app.removeTypingStatus(data.nick);
});

socket.on('con toc', (data) => {
    app.guesses = data.guesses;
    app.leaders = data.leaders;
    //console.log("guesses updated");
    console.log(data.leaders);
});
