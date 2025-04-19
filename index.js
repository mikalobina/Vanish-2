const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const { v4: uuidv4 } = require('uuid');

const rooms = {};

app.use(express.static('public'));

io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('create-room', (maxMembers, callback) => {
    const code = uuidv4().slice(0, 6);
    rooms[code] = {
      owner: socket.id,
      max: parseInt(maxMembers),
      users: [socket],
      messages: []
    };

    socket.join(code);
    socket.data.roomCode = code;
    socket.data.name = 'Stranger 1';

    callback(code);
  });

  socket.on('join-room', ({ code }, callback) => {
    if (!rooms[code]) return callback({ error: 'Room not found' });
    if (rooms[code].users.length >= rooms[code].max)
      return callback({ error: 'Room is full' });

    const userCount = rooms[code].users.length + 1;
    const name = 'Stranger ' + userCount;

    socket.join(code);
    socket.data.roomCode = code;
    socket.data.name = name;

    rooms[code].users.push(socket);

    io.to(code).emit('user-joined', name);

    callback({
      name,
      messages: rooms[code].messages,
      isOwner: rooms[code].owner === socket.id
    });
  });

  socket.on('send-message', (msg, replyTo) => {
    const code = socket.data.roomCode;
    if (!code) return;
    const time = new Date().toLocaleTimeString();
    const message = {
      from: socket.data.name,
      text: msg,
      replyTo,
      time,
    };

    rooms[code].messages.push(message);
    io.to(code).emit('new-message', message);
  });

  socket.on('vanish', () => {
    const code = socket.data.roomCode;
    if (rooms[code] && rooms[code].owner === socket.id) {
      delete rooms[code];
      io.to(code).emit('room-vanished');
    }
  });

  socket.on('disconnect', () => {
    const code = socket.data.roomCode;
    if (!code || !rooms[code]) return;

    const name = socket.data.name;

    rooms[code].users = rooms[code].users.filter(s => s.id !== socket.id);

    if (rooms[code].users.length === 0) {
      delete rooms[code];
    } else {
      io.to(code).emit('user-left', name);
    }
  });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
