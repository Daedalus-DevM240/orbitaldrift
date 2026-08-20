<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Galactic Combat - 30 Niveles</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div id="game-container">
        <header id="ui-layer">
            <h1>COMBATE GALÁCTICO</h1>
            <div id="stats">
                Nivel: <span id="level-display">1</span>/30 | 
                Puntuación: <span id="score-display">0</span> | 
                Escudo: <span id="shield-display">100</span>%
            </div>
        </header>
        <canvas id="gameCanvas" width="800" height="600"></canvas>
        <div id="game-over" class="hidden">
            <h2 id="end-title">MISIÓN FALLIDA</h2>
            <p id="end-text">Tu nave ha sido destruida.</p>
            <button onclick="restartGame()">REINICIAR SISTEMA</button>
        </div>
    </div>
    <script src="/socket.io/socket.io.js"></script>
    <script src="game.js"></script>
</body>
</html>