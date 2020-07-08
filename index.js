const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);

const game = require('./game.js');
const port = process.env.PORT || 3000;

app.use(express.static('public'));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

app.get('/old', (req, res) => {
    res.sendFile(__dirname + '/vuetify.html');
});


let numUsers = 0;
let cheatEnabled = false;
let cheatCode = "cheatcode";

io.on('connection', (socket) => {
    let added = false;
    socket.emit('con toc', { guesses: game.obj.guesses, leaders: game.obj.leader});

    socket.on('new mes tos', (message) => {
        if(!added) return;

        if(cheatEnabled && message.text.startsWith(cheatCode)) {
            socket.emit('new mes toc',
            { text: game.obj.godMode(message.text.substring(cheatCode.length)), nick:'bot' });
            return;
        }
        socket.broadcast.emit('new mes toc', message);
        // -------------------------------------------------
        let text = message.text;
        if (text.startsWith('')) {
            var result = game.obj.cmd(text, message.nick); 
            if(result)
                io.emit('new mes toc',
                    { text: result, nick: 'bot', toNick: message.nick,
                      byBot: true, guesses: game.obj.guesses, leaders: game.obj.leader });
        }
        //----------------------------------------------
    });
    socket.on('typing tos', _ => socket.broadcast.emit('typing toc', { nick: socket.nick }));
    socket.on('no typing tos', _ => socket.broadcast.emit('no typing toc', { nick:socket.nick }));

    socket.on('add user tos', (nick) => {
        if(nick === 'bot') return;
        if (!added)
            ++numUsers;
        socket.nick = nick;
        added = true;
        io.emit('add user toc', {nick: nick, numUser: numUsers});
    });

    socket.on('disconnect', (data) => {
        if (added) {
            --numUsers;
            socket.broadcast.emit('user left toc', { numUser: numUsers, nick:socket.nick });
        }
    });
});

server.listen(port, () => console.log(`Example app listening at http://localhost:${port}`));