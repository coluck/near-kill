const fs = require('fs');
var http = require('http');
const _ = require('lodash');
const axios = require('axios');

var fileName = './leaders.json';
var help_text = `Near Kill is a number guessing game bot.
                Near means the amount of correct number.
                Kill means the amount of right place number.
                To start a game write 'go<3-9>'.
                To guess a number write '4208'.
                The default game is for 4 digits number.`.trim();


function saveToFile(fileName, obj) {
  const data = JSON.stringify(obj);
  fs.writeFile(fileName, data, (err) => {
    if (err)
      throw err;
  });
}

function readFromFile(fileName) {
  var obj;
  try {
    obj = JSON.parse(fs.readFileSync(fileName))
  }
  catch {
    fs.writeFile(fileName, '{}', function (err) {
      if (err) throw err;
      console.log('File is created successfully.');
    });
    obj = {};
  }
  return obj;
}

var gameObj = {
  started: false,
  num: [],
  leader: readFromFile(fileName),
  guesses: {},

  cmd: function (command, nick) {
    //var text = command.substring(1).trim();
    var text = command.trim();
    //var pattern = /^.[\s]*[0-9]+$/;
    var pattern = /^[0-9]+$/;
    let modes = ['3', '4', '5', '6', '7', '8', '9']
    var result;
    if (text.startsWith('start') || text.toUpperCase().startsWith('GO')) {
      let numlen = 4;
      if (modes.indexOf(text[text.length - 1]) !== -1)
        numlen = parseInt(text[text.length - 1]);
      result = this.start(nick, numlen);
    }
    else if (text === 'help')
      result = this.help();
    else if (text.match(pattern))
      result = this.makeGuess(text, nick);
    else
      result = null;
    return result;
  },
  godMode: function (command) {
    if (command.search("kill") !== -1)
      return this.kill();
    return this.status();
  },
  status: function () {
    return `started: ${this.started},
        num: ${this.num.join("")}`;
  },

  start: function (nick, numlen) {
    if (!this.started) {
      this.guesses = {};
      this.started = true;
      this.num = createNum(numlen);
      return `Let me guess a number @${nick}... Guess the number`;
    }
    return `The game has already begun. Guess the ${this.num.length} digits number @${nick}`;
  },
  kill: function () {
    this.started = false;
    this.num = [];
    this.leader = {};
    this.guesses = {};
    saveToFile(fileName, this.leader);
    return "killed 200";
  },
  makeGuess: function (guess, nick) {
    var gs = guess.split("");
    var numlen = this.num.length;
    if (!this.started)
      return `The game has not begun. To start the game write 'go<3-9>' @${nick}`;
    if (guess[0] === 0)
      return `number cannot start with 0 @${nick}`;
    if (guess.length !== numlen)
      return `${numlen} digits number please @${nick}`;
    if (hasDup(guess))
      return `Number cannot have duplicate digits @${nick}`;

    this.guesses[guess] = this.guesses[guess] || makeGuess(this.num, gs);
    var result = this.guesses[guess];
    if (result[1] === numlen)
      return this.win(nick);
    else
      return `${guess} → near: ${result[0]}, kill: ${result[1]} @${nick}`;
  },
  addGuess: function (gs, result) {
    this.guesses[gs] = this.guesses[gs] || "";
    this.guesses[gs] = result;
  },
  win: function (nick) {
    var gs = this.num.join("");
    var steps = Object.keys(this.guesses).length;
    this.leader[nick] = this.leader[nick] || 0;
    this.leader[nick] = this.leader[nick] + this.num.length * 3;
    this.num = [];
    this.started = false;
    saveToFile(fileName, this.leader);
    return `👍@${nick} Won. Well done! The correct number was ${gs}. Know in ${steps} steps`;
  },
  help: function () {
    return help_text;
  },
  test: function () { console.log(this.leader) },
  lb: () => { }
};

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

function createNum(n = 4, noStart0 = true, diff = true) {
  if (diff) {
    let array = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
    shuffleArray(array);
    if (noStart0 && array[0] === '0')
      createNum(n, noStart0);
    return array.slice(0, n);
  }
  else {
    let retarr = [];
    for (let i = 0; i < n; i++) {
      let rnd = Math.floor(Math.random() * (10))
      retarr.push(rnd.toString());
    }
    return retarr;
  }
}

function hasDup(array) {
  return _.uniq(array).length !== array.length;
}

function makeGuess(real, guess) {
  if (hasDup(guess))
    return null;
  if (guess.length !== real.length)
    return null;

  var near = 0, kill = 0;
  real.forEach((element, index) => {
    if (real.includes(guess[index])) {
      near++;
      if (real[index] === guess[index])
        kill++;
    }
  });
  return [near, kill];
}


exports.obj = gameObj;
