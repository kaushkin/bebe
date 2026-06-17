const bebe = document.getElementById('bebe');
const startScreen = document.getElementById('startScreen');
const gameOverScreen = document.getElementById('gameOverScreen');
const gameContainer = document.getElementById('gameContainer');
const startBtn = document.getElementById('startBtn');
const restartBtn = document.getElementById('restartBtn');
const scoreEl = document.getElementById('score');
const finalScoreEl = document.getElementById('finalScore');
const bestScoreEl = document.getElementById('bestScore');
const playArea = document.getElementById('playArea');

if (typeof GAME_TEXT !== 'undefined') {
    document.getElementById('uiTitle').innerHTML = GAME_TEXT.title;
    document.getElementById('uiSubtitle').innerHTML = GAME_TEXT.subtitle;
    document.getElementById('uiCredits').innerHTML = GAME_TEXT.credits;
    startBtn.innerHTML = GAME_TEXT.startButton;
    document.getElementById('uiGameOverTitle').innerHTML = GAME_TEXT.gameOverTitle;
    document.getElementById('uiScoreText').innerHTML = GAME_TEXT.scoreText;
    document.getElementById('uiBestScoreText').innerHTML = GAME_TEXT.bestScoreText;
    restartBtn.innerHTML = GAME_TEXT.restartButton;
}

let animationId;
let gameRunning = false;
let score = 0;
let bestScore = localStorage.getItem('bebeBestScore') || 0;

const BASE_HEIGHT = 512;
const BASE_GRAVITY = 0.20;
const BASE_JUMP = -4.8;
const BASE_SPEED = 2.8; 
const BASE_GAP = 150; 
const BASE_DISTANCE = 180; 
const BASE_PIPE_WIDTH = 55;
const BASE_BIRD_SIZE = 40; 
const BASE_COLLECTIBLE_SIZE = 40;

let scale;
let gravity;
let jumpStrength;
let pipeSpeed;
let pipeGap;
let pipeDistance;
let pipeWidth;
let birdSize;
let collectibleSize;

let birdY;
let birdVelocity;
let birdX;
let birdRotation = 0;

let pipes = [];
let collectibles = [];
let distanceSinceLastPipe = 0;

let lastTime = 0;
let accumulator = 0;
const frameInterval = 1000 / 60; 

function calculatePhysics() {
    scale = playArea.clientHeight / BASE_HEIGHT;
    
    gravity = BASE_GRAVITY * scale;
    jumpStrength = BASE_JUMP * scale;
    pipeSpeed = BASE_SPEED * scale;
    pipeGap = BASE_GAP * scale;
    pipeDistance = BASE_DISTANCE * scale;
    pipeWidth = BASE_PIPE_WIDTH * scale;
    birdSize = BASE_BIRD_SIZE * scale;
    collectibleSize = BASE_COLLECTIBLE_SIZE * scale;
    
    birdX = playArea.clientWidth * 0.3;
    
    bebe.style.width = `${birdSize}px`;
    bebe.style.height = `${birdSize}px`;
}

function initGame() {
    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    gameContainer.classList.remove('hidden');
    
    calculatePhysics();
    
    gameRunning = true;
    score = 0;
    scoreEl.textContent = score;
    birdY = playArea.clientHeight / 2;
    birdVelocity = 0;
    birdRotation = 0;
    
    pipes.forEach(p => {
        p.topEl.remove();
        p.bottomEl.remove();
    });
    pipes = [];
    
    collectibles.forEach(c => c.el.remove());
    collectibles = [];
    
    distanceSinceLastPipe = pipeDistance;
    
    lastTime = performance.now();
    accumulator = 0;
    
    animationId = requestAnimationFrame(gameLoop);
}

function jump() {
    if (!gameRunning) return;
    birdVelocity = jumpStrength;
    birdRotation = -20; 
}

window.addEventListener('pointerdown', (e) => {
    if (e.target.tagName.toLowerCase() === 'button') return;
    jump();
});
window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') jump();
});

function spawnPipe() {
    const areaHeight = playArea.clientHeight;
    const minPipeHeight = 50 * scale; 
    const maxPipeHeight = areaHeight - pipeGap - minPipeHeight;
    
    const topHeight = Math.floor(Math.random() * (maxPipeHeight - minPipeHeight + 1)) + minPipeHeight;
    
    const topPipeEl = document.createElement('div');
    topPipeEl.classList.add('pipe', 'top');
    topPipeEl.style.width = `${pipeWidth}px`;
    topPipeEl.style.height = `${topHeight}px`;
    topPipeEl.style.left = `${playArea.clientWidth}px`;
    topPipeEl.style.top = '0px';
    
    const bottomPipeEl = document.createElement('div');
    bottomPipeEl.classList.add('pipe');
    bottomPipeEl.style.width = `${pipeWidth}px`;
    bottomPipeEl.style.height = `${areaHeight - topHeight - pipeGap}px`;
    bottomPipeEl.style.left = `${playArea.clientWidth}px`;
    bottomPipeEl.style.bottom = '0px';
    
    playArea.appendChild(topPipeEl);
    playArea.appendChild(bottomPipeEl);
    
    pipes.push({
        x: playArea.clientWidth,
        topHeight: topHeight,
        topEl: topPipeEl,
        bottomEl: bottomPipeEl,
        passed: false
    });
    
    if (Math.random() < 0.3) {
        spawnCollectible(playArea.clientWidth + (pipeDistance / 2), topHeight, pipeGap);
    }
}

function spawnCollectible(xOffset, pipeTopHeight, pipeGapHeight) {
    const minHeight = 50 * scale;
    const maxHeight = playArea.clientHeight - minHeight - collectibleSize;
    
    const isDangerous = Math.random() > 0.5;
    
    let yPos;
    if (isDangerous) {
        yPos = pipeTopHeight + (pipeGapHeight / 2) - (collectibleSize / 2);
    } else {
        yPos = Math.floor(Math.random() * (maxHeight - minHeight)) + minHeight;
        if (Math.abs(yPos - pipeTopHeight) < 100 * scale) {
            yPos = maxHeight - 100 * scale;
        }
    }
    
    const colEl = document.createElement('div');
    colEl.classList.add('collectible');
    colEl.textContent = '🌸';
    colEl.style.fontSize = `${collectibleSize}px`;
    colEl.style.left = `${xOffset}px`;
    colEl.style.top = `${yPos}px`;
    
    playArea.appendChild(colEl);
    
    collectibles.push({
        x: xOffset,
        y: yPos,
        el: colEl
    });
}

function showScorePopup(x, y, amount) {
    const popup = document.createElement('div');
    popup.classList.add('score-popup');
    popup.textContent = `+${amount}`;
    popup.style.left = `${x}px`;
    popup.style.top = `${y}px`;
    playArea.appendChild(popup);
    
    setTimeout(() => {
        if (popup.parentNode) popup.remove();
    }, 1000);
}

function gameOver() {
    gameRunning = false;
    cancelAnimationFrame(animationId);
    
    if (score > bestScore) {
        bestScore = score;
        localStorage.setItem('bebeBestScore', bestScore);
    }
    
    finalScoreEl.textContent = score;
    bestScoreEl.textContent = bestScore;
    
    const flash = document.createElement('div');
    flash.style.position = 'absolute';
    flash.style.top = '0'; flash.style.left = '0';
    flash.style.width = '100%'; flash.style.height = '100%';
    flash.style.background = 'white';
    flash.style.zIndex = '9999';
    flash.style.transition = 'opacity 0.1s';
    playArea.appendChild(flash);
    
    setTimeout(() => {
        flash.style.opacity = '0';
        setTimeout(() => flash.remove(), 100);
    }, 50);

    setTimeout(() => {
        gameOverScreen.classList.remove('hidden');
    }, 400);
}

function updatePhysics() {
    birdVelocity += gravity;
    birdY += birdVelocity;
    
    if (birdVelocity < 5 * scale) {
        birdRotation = -20;
    } else {
        birdRotation += 4; 
        if (birdRotation > 90) birdRotation = 90;
    }
    
    if (birdY + birdSize > playArea.clientHeight || birdY < 0) {
        birdY = Math.min(birdY, playArea.clientHeight - birdSize);
        gameOver();
        return;
    }
    
    distanceSinceLastPipe += pipeSpeed;
    if (distanceSinceLastPipe >= pipeDistance) {
        spawnPipe();
        distanceSinceLastPipe = 0;
    }
    
    const hitPadX = birdSize * 0.15;
    const hitPadY = birdSize * 0.20;
    const bLeft = birdX + hitPadX;
    const bRight = birdX + birdSize - hitPadX;
    const bTop = birdY + hitPadY;
    const bBottom = birdY + birdSize - hitPadY;
    
    for (let i = pipes.length - 1; i >= 0; i--) {
        let p = pipes[i];
        p.x -= pipeSpeed;
        
        const pLeft = p.x;
        const pRight = p.x + pipeWidth;
        
        if (bRight > pLeft && bLeft < pRight) {
            if (bTop < p.topHeight || bBottom > p.topHeight + pipeGap) {
                gameOver();
                return;
            }
        }
        
        if (pLeft + pipeWidth < birdX && !p.passed) {
            p.passed = true;
            score++;
            scoreEl.textContent = score;
        }
        
        if (pRight < -100) {
            p.topEl.remove();
            p.bottomEl.remove();
            pipes.splice(i, 1);
        }
    }
    
    for (let i = collectibles.length - 1; i >= 0; i--) {
        let c = collectibles[i];
        c.x -= pipeSpeed;
        
        const cLeft = c.x;
        const cRight = c.x + collectibleSize;
        const cTop = c.y;
        const cBottom = c.y + collectibleSize;
        
        if (bRight > cLeft && bLeft < cRight && bBottom > cTop && bTop < cBottom) {
            score += 3;
            scoreEl.textContent = score;
            showScorePopup(c.x, c.y, 3);
            c.el.remove();
            collectibles.splice(i, 1);
            continue;
        }
        
        if (cRight < -100) {
            c.el.remove();
            collectibles.splice(i, 1);
        }
    }
}

function render() {
    bebe.style.transform = `translateY(${birdY}px) rotate(${birdRotation}deg)`;
    bebe.style.left = `${birdX}px`;
    bebe.style.top = '0px'; 
    
    for (let i = 0; i < pipes.length; i++) {
        pipes[i].topEl.style.left = `${pipes[i].x}px`;
        pipes[i].bottomEl.style.left = `${pipes[i].x}px`;
    }
    
    for (let i = 0; i < collectibles.length; i++) {
        collectibles[i].el.style.left = `${collectibles[i].x}px`;
    }
}

function gameLoop(currentTime) {
    if (!gameRunning) return;
    
    animationId = requestAnimationFrame(gameLoop);
    
    let dt = currentTime - lastTime;
    if (dt > 100) dt = 100; 
    lastTime = currentTime;
    
    accumulator += dt;
    
    while (accumulator >= frameInterval) {
        if (!gameRunning) break;
        updatePhysics();
        accumulator -= frameInterval;
    }
    
    if (gameRunning) {
        render();
    }
}

startBtn.addEventListener('click', initGame);
restartBtn.addEventListener('click', initGame);

bestScoreEl.textContent = bestScore;
