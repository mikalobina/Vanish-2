const socket = io();
let myName = '';
let replyTo = null;
let currentRoomCode = '';

document.getElementById('start').onclick = () => {
  const max = parseInt(document.getElementById('maxMembers').value);
  if (!max || max < 2 || max > 10) {
    return alert('Please enter a valid number (2 to 10) for Max Members.');
  }

  socket.emit('create-room', max, (code) => {
    currentRoomCode = code;
    document.getElementById('roomCodeDisplay').innerText = `Room Code: ${code}`;
    document.getElementById('welcome').style.display = 'none';
    document.getElementById('chatBox').style.display = 'block';
    document.getElementById('vanishBtn').style.display = 'inline-block';
  });
};

document.getElementById('join').onclick = () => {
  const code = document.getElementById('joinCode').value.trim();
  if (!code) return alert("Please enter a room code.");
  socket.emit('join-room', { code }, (res) => {
    if (res.error) return alert(res.error);
    myName = res.name;
    currentRoomCode = code;

    document.getElementById('roomCodeDisplay').innerText = `Room Code: ${code}`;
    document.getElementById('welcome').style.display = 'none';
    document.getElementById('chatBox').style.display = 'block';

    res.messages?.forEach(displayMessage);

    if (res.isOwner) {
      document.getElementById('vanishBtn').style.display = 'inline-block';
    } else {
      document.getElementById('vanishBtn').style.display = 'none';
    }
  });
};

document.getElementById('sendBtn').onclick = () => {
  const text = document.getElementById('chatInput').value.trim();
  if (!text) return;
  socket.emit('send-message', text, replyTo);
  replyTo = null;
  document.getElementById('chatInput').value = '';
};

document.getElementById('vanishBtn').onclick = () => {
  socket.emit('vanish');
};

socket.on('user-joined', (name) => {
  addMessage(`${name} joined the chat`);
});

socket.on('user-left', (name) => {
  addMessage(`${name} left the chat`);
});

socket.on('new-message', (msg) => {
  displayMessage(msg);
});

socket.on('room-vanished', () => {
  alert("The room has been vanished by the owner.");
  location.reload();
});

function addMessage(text) {
  const div = document.createElement('div');
  div.textContent = text;
  document.getElementById('chatMessages').appendChild(div);
  scrollChatToBottom();
}

function displayMessage(msg) {
  const div = document.createElement('div');
  div.className = 'message';
  div.innerHTML = `
    <p><strong>${msg.from}</strong> [${msg.time}]</p>
    ${msg.replyTo ? `<blockquote>Replying to: ${msg.replyTo}</blockquote>` : ''}
    <p>${msg.text}</p>
    <button onclick="setReply('${msg.text.replace(/'/g, "\\'")}')">Reply</button>
  `;
  document.getElementById('chatMessages').appendChild(div);
  scrollChatToBottom();
}

function setReply(text) {
  replyTo = text;
  document.getElementById('chatInput').focus();
}

function scrollChatToBottom() {
  const chat = document.getElementById('chatMessages');
  chat.scrollTop = chat.scrollHeight;
}

// ✅ Enter key press = send message
document.getElementById('chatInput').addEventListener('keyup', function(event) {
  if (event.key === 'Enter') {
    document.getElementById('sendBtn').click();
  }
});

