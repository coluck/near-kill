var socket = io();
Vue.use(Toasted);

const TYPING_TIMER_LENGTH = 700;
const help_text = `Near Kill is a number guessing game bot.
Near means the amount of correct number.
Kill means the amount of right place number.
To start a game write 'go<3-9>'.
To guess a number write '4208'.
The default game is for 4 digits number.`.trim();

window.onkeydown = () => {
    document.querySelector(".input").focus();
}

function fancyDate() {
    let date = new Date();
    let hour = `${date.getHours().toString().padStart(2, "0")}`;
    let min  = `${date.getMinutes().toString().padStart(2, "0")}`;
    let sec  = `${date.getSeconds().toString().padStart(2, "0")}`;
    let msec = `${date.getMilliseconds().toString().padStart(3, "0")}`;

    let time = `${hour}:${min}:${sec}::${msec}`.trim();
    return time;
}

var userStorage = {
    getNick: () => {
        var nick = localStorage.getItem('nick');
        if(!nick || nick === 'bot') {
            return null;
        }
        return nick;
    },
    save: (nick) => {
        localStorage.setItem('nick', nick);
    }
}

var app = new Vue({
    el: '#app',
    data: { 
        nick: '',
        message: '',            // message input value
        messages: [],           // all messages
        guesses: {},            // current guesses for game
        leaders: {},            // for leaderboards
        nickInp: '',            // nick input value
        lastTypingTime: null,   // last typing time for user
        typing: false,          // is current user typing
        typingStatus: [],       // list of users who are typing
        numUser: 0,             // total user connected to socket
        connected: false,       // connection status
    },
    methods: {
        setNick() {
            if(!this.nickInp) return;
            this.nick = this.nickInp !== 'bot'? this.nickInp : null;
        },
        changeNick() {
            this.nickInp = this.nick;
            this.nick = null;
        },
        updateTyping() {
            if (!this.typing) {
                this.typing = true;
                socket.emit('typing tos');
            }
            this.lastTypingTime = (new Date()).getTime();
            setTimeout(() => {
                var typingTimer = (new Date()).getTime();
                var timeDiff = typingTimer - this.lastTypingTime;
                if (timeDiff >= TYPING_TIMER_LENGTH && this.typing) {
                    socket.emit('no typing tos');
                    this.typing = false;
                }
            }, TYPING_TIMER_LENGTH);
        },
        addTypingStatus(nick) {
            this.typingStatus.push(nick);
        },
        removeTypingStatus(nick) {
            while(this.typingStatus.indexOf(nick) != -1)
                this.typingStatus.splice(this.typingStatus.indexOf(nick), 1);
        },
        sendMessage() {
            if(!this.message) return;
            var data = {text: this.message, nick: this.nick, time: fancyDate()}
            this.addMessage(data);
            this.message = '';
            this.$refs.mesinp.focus();
            //console.log(this.data)
            socket.emit('new mes tos', data);
        },
        addMessage(data) {
            if(data.byBot) {
                if(data.text.startsWith('👍')) {
                    this.toast(`👍 ${data.toNick} WON!`);
                    this.leaders = data.leaders;
                }
                else {
                    this.addGuess(data.guesses);
                    this.toast('a new message from bot 🤖');
                }
                data.time = fancyDate();
            }
            if(data === 'help')
                data = {text: help_text, nick: 'bot'};
            this.messages.push(data);
        },
        addGuess(guesses) {
            this.guesses = guesses;
        },
        toast(message) {
            this.$toasted.show(message, {
                theme: "toasted-primary", 
                position: "top-right", 
                duration : 1000
            });
        },
        reload() {
            window.location.reload(false);
        }
    },
    computed: {
        leaderBoard: function() {
            var sortable = [];
            for (var leader in this.leaders) {
                sortable.push([leader, this.leaders[leader]]);
            }
            sortable.sort(function(a, b) {
                return b[1] - a[1];
            });
            return sortable;
        }
    },
    created: function() {
        this.nick = userStorage.getNick();
    },
    updated: function() {
        var messagesList = this.$el.querySelector("#mesbox");
        messagesList.scrollTo(0,messagesList.scrollHeight);
    },
    watch: {
        nick: function(val) {
            if(val) {
                this.toast(`Hello👋 ${this.nick || ''}`);
                userStorage.save(this.nick);
                socket.emit('add user tos', this.nick);
            }
        },
        connected: function(val) {
            if(!val) {
                this.toast(`Disconnected`);
            }
        }
    },
});

