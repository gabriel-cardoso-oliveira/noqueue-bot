const express = require('express');
const cors = require('cors');
const CronJob = require('cron').CronJob;

const app = express();

const io = require('socket.io-client');
const socket = io('http://localhost:3333');

app.use(cors());
app.use(express.json());

  const units = [
    '959e09d387a9',
    '0dfa5683ffcb',
    'e71b6a63bf7f',
    '2e4ce12da93e',
    'c8d94f108525',
  ];
  
  const sectors = [
    'Caixa',
    'Atendimento',
  ];

const passwords = [];

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min;
}

function formatDigits(number) {
  return number < 10 ? `0${number}` : number;
}

function getTime() {
  const date = new Date();

  return `${
    formatDigits(date.getHours())
  }:${
    formatDigits(date.getMinutes())
  }:${
    formatDigits(date.getMilliseconds())
  }`;
}

function getDate() {
  const date = new Date();

  return `${date.getFullYear()}-${
    formatDigits(date.getMonth() + 1)
  }-${
    formatDigits(date.getDate())
  }`;
}

function issuePassword() {
  const id = getRandomInt(0, units.length);
  const sector = sectors[getRandomInt(0, sectors.length)];

  const password = {
    code: units[id],
    status: 'iniciado',
    sector,
    date: getDate(),
    hour: getTime(),
    start: '00:00:00',
    end: '00:00:00',
    unit_id: id + 1,
  };

  passwords.push(password);

  socket.emit('issuePassword', password);

  return password;
}

function closePassword(id) {
  const password = passwords[id];

  password.end = getTime();
  password.status = 'encerrado';

  passwords.splice(id, 1, password);

  socket.emit('closePassword', password);

  return password;
}

function startPassword() {
  if (!passwords.length) return;

  const id = getRandomInt(0, passwords.length);
  const password = passwords[id];

  if (password.status === 'chamado') {
    return closePassword(id);
  } else if (password.status === 'encerrado') return;

  password.start = getTime();
  password.status = 'chamado';

  passwords.splice(id, 1, password);

  socket.emit('startPassword', password);

  return password;
}

const functions = [
  { fun: issuePassword },
  { fun: startPassword },
];

const job = new CronJob('*/10 * * * * *', () => {
  const index = getRandomInt(0, functions.length);

  functions[index].fun();
  console.log(passwords);
}, null, true, 'America/Sao_Paulo');

job.start();

app.listen(3000, () => {
  console.log('listening on *:3000');
});