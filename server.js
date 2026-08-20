const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

let gameState = {
    level: 1,
    score: 0,
    maxLevels: 30
};

io.on('connection', (socket) => {
    console.log('Piloto conectado al servidor táctico');
    socket.emit('init', gameState);

    socket.on('nextLevel', (data) => {
        if (gameState.level < gameState.maxLevels) {
            gameState.level++;
            gameState.score = data.score;
            io.emit('levelUpdate', gameState);
        }
    });
});

http.listen(3000, () => console.log('Servidor activo en http://localhost:3000'));