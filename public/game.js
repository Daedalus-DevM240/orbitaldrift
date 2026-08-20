const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let socket;
try {
    socket = io();
} catch (e) {
    console.log("Socket.io no disponible, operando en modo local.");
}

let score = 0;
let level = 1;
let maxLevels = 30;
let isGameOver = false;

let player = {
    x: 375,
    y: 500,
    width: 50,
    height: 40,
    speed: 6,
    shield: 100,
    bullets: [],
    doubleFire: false,
    fireTimer: 0
};

let enemies = [];
let particles = [];
let powerUps = [];
let keys = { ArrowLeft: false, ArrowRight: false, Space: false };

window.addEventListener('keydown', e => {
    if (e.code === 'ArrowLeft') keys.ArrowLeft = true;
    if (e.code === 'ArrowRight') keys.ArrowRight = true;
    if (e.code === 'Space' && !keys.Space) {
        keys.Space = true;
        shoot();
    }
});

window.addEventListener('keyup', e => {
    if (e.code === 'ArrowLeft') keys.ArrowLeft = false;
    if (e.code === 'ArrowRight') keys.ArrowRight = false;
    if (e.code === 'Space') keys.Space = false;
});

function shoot() {
    if (isGameOver) return;
    if (player.doubleFire) {
        player.bullets.push({ x: player.x + 10, y: player.y, width: 4, height: 15, speed: 8 });
        player.bullets.push({ x: player.x + player.width - 14, y: player.y, width: 4, height: 15, speed: 8 });
    } else {
        player.bullets.push({ x: player.x + player.width / 2 - 2, y: player.y, width: 4, height: 15, speed: 8 });
    }
}

function spawnEnemies() {
    enemies = [];
    let enemyRows = Math.min(2 + Math.floor(level / 3), 5);
    let enemyCols = 6;
    for (let r = 0; r < enemyRows; r++) {
        for (let c = 0; c < enemyCols; c++) {
            enemies.push({
                x: 100 + c * 100,
                y: 60 + r * 50,
                width: 40,
                height: 30,
                speed: 1 + (level * 0.1)
            });
        }
    }
}

// Crear explosión de partículas
function createExplosion(x, y, color) {
    for (let i = 0; i < 15; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 6,
            vy: (Math.random() - 0.5) * 6,
            alpha: 1.0,
            color: color,
            size: Math.random() * 3 + 2
        });
    }
}

// Generar Power-up aleatorio al destruir enemigos
function dropPowerUp(x, y) {
    if (Math.random() < 0.25) { 
        let type = Math.random() < 0.5 ? 'shield' : 'double';
        powerUps.push({
            x: x + 15,
            y: y,
            width: 20,
            height: 20,
            speed: 2,
            type: type
        });
    }
}

function nextLevel() {
    level++;
    if (level <= maxLevels) {
        spawnEnemies();
    } else {
        triggerWin();
    }
}

function update() {
    if (isGameOver) return;

    // Control de tiempo para power-ups
    if (player.doubleFire) {
        player.fireTimer--;
        if (player.fireTimer <= 0) player.doubleFire = false;
    }

    // Movimiento del jugador
    if (keys.ArrowLeft && player.x > 0) player.x -= player.speed;
    if (keys.ArrowRight && player.x < canvas.width - player.width) player.x += player.speed;

    // Actualizar balas
    for (let i = player.bullets.length - 1; i >= 0; i--) {
        let b = player.bullets[i];
        b.y -= b.speed;
        if (b.y < 0) {
            player.bullets.splice(i, 1);
            continue;
        }

        // Colisión con enemigos
        let bulletHit = false;
        for (let j = enemies.length - 1; j >= 0; j--) {
            let en = enemies[j];
            if (b.x > en.x && b.x < en.x + en.width && b.y > en.y && b.y < en.y + en.height) {
                createExplosion(en.x + en.width / 2, en.y + en.height / 2, '#ff3366');
                dropPowerUp(en.x, en.y);
                
                // Eliminar enemigo y bala
                enemies.splice(j, 1);
                bulletHit = true;
                score += 100;
                
                // Si ya no quedan enemigos, pasa al siguiente nivel automáticamente
                if (enemies.length === 0) {
                    nextLevel();
                }
                break;
            }
        }

        if (bulletHit) {
            player.bullets.splice(i, 1);
        }
    }

    // Actualizar Power-ups
    for (let i = powerUps.length - 1; i >= 0; i--) {
        let p = powerUps[i];
        p.y += p.speed;

        if (p.x < player.x + player.width && p.x + p.width > player.x &&
            p.y < player.y + player.height && p.y + p.height > player.y) {
            
            if (p.type === 'shield') {
                player.shield = Math.min(100, player.shield + 25);
            } else if (p.type === 'double') {
                player.doubleFire = true;
                player.fireTimer = 400; 
            }
            powerUps.splice(i, 1);
            continue;
        }

        if (p.y > canvas.height) {
            powerUps.splice(i, 1);
        }
    }

    // Actualizar Partículas
    for (let i = particles.length - 1; i >= 0; i--) {
        let pt = particles[i];
        pt.x += pt.vx;
        pt.y += pt.vy;
        pt.alpha -= 0.03;
        if (pt.alpha <= 0) {
            particles.splice(i, 1);
        }
    }

    // Movimiento de enemigos
    let hitEdge = false;
    for (let en of enemies) {
        en.x += en.speed;
        if (en.x > canvas.width - 50 || en.x < 10) hitEdge = true;
    }
    if (hitEdge) {
        for (let en of enemies) {
            en.speed *= -1;
            en.y += 15;
            if (en.y >= player.y - 20) gameOver();
        }
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Dibujar Partículas
    for (let pt of particles) {
        ctx.save();
        ctx.globalAlpha = pt.alpha;
        ctx.fillStyle = pt.color;
        ctx.shadowBlur = 8;
        ctx.shadowColor = pt.color;
        ctx.fillRect(pt.x, pt.y, pt.size, pt.size);
        ctx.restore();
    }

    // Dibujar Power-ups
    for (let p of powerUps) {
        ctx.save();
        ctx.shadowBlur = 12;
        ctx.shadowColor = p.type === 'shield' ? '#00ffff' : '#ffcc00';
        ctx.fillStyle = p.type === 'shield' ? '#00ffff' : '#ffcc00';
        ctx.fillRect(p.x, p.y, p.width, p.height);
        ctx.fillStyle = '#000';
        ctx.font = '10px Courier New';
        ctx.fillText(p.type === 'shield' ? 'S' : '2X', p.x + 5, p.y + 14);
        ctx.restore();
    }

    // Dibujar Jugador
    ctx.shadowBlur = 15;
    ctx.shadowColor = player.doubleFire ? '#ffcc00' : '#00ffff';
    ctx.fillStyle = player.doubleFire ? '#ffcc00' : '#00ffff';
    ctx.fillRect(player.x, player.y + 15, player.width, 15);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(player.x + 20, player.y, 10, 20);

    // Dibujar Balas
    ctx.shadowBlur = 10;
    ctx.shadowColor = player.doubleFire ? '#ffcc00' : '#33ff66';
    ctx.fillStyle = player.doubleFire ? '#ffcc00' : '#33ff66';
    for (let b of player.bullets) {
        ctx.fillRect(b.x, b.y, b.width, b.height);
    }

    // Dibujar Enemigos
    ctx.shadowBlur = 12;
    ctx.shadowColor = '#ff3366';
    ctx.fillStyle = '#ff3366';
    for (let en of enemies) {
        ctx.fillRect(en.x, en.y, en.width, en.height);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(en.x + 15, en.y + 10, 10, 10);
        ctx.fillStyle = '#ff3366';
    }

    ctx.shadowBlur = 0;

    // Actualizar UI HTML
    document.getElementById('level-display').innerText = level;
    document.getElementById('score-display').innerText = score;
    document.getElementById('shield-display').innerText = player.shield;
}

function gameLoop() {
    update();
    draw();
    if (!isGameOver) {
        requestAnimationFrame(gameLoop);
    }
}

function gameOver() {
    isGameOver = true;
    document.getElementById('game-over').classList.remove('hidden');
}

function triggerWin() {
    isGameOver = true;
    document.getElementById('end-title').innerText = "¡VICTORIA GALÁCTICA!";
    document.getElementById('end-text').innerText = "Has completado con éxito los 30 niveles de combate.";
    document.getElementById('game-over').classList.remove('hidden');
}

function restartGame() {
    isGameOver = false;
    score = 0;
    level = 1;
    player.shield = 100;
    player.x = 375;
    player.bullets = [];
    player.doubleFire = false;
    powerUps = [];
    particles = [];
    document.getElementById('game-over').classList.add('hidden');
    spawnEnemies();
    gameLoop();
}

// Inicialización directa
spawnEnemies();
gameLoop();