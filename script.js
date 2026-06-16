const bebe = document.getElementById('bebe');
const scoreElement = document.getElementById('score');
const moodElement = document.getElementById('mood');
const playArea = document.getElementById('playArea');
const startScreen = document.getElementById('startScreen');
const startBtn = document.getElementById('startBtn');

let score = 0;
let moveInterval;

const moods = [
    { threshold: 0, text: 'пока на чилле', speed: 1500, size: 110 },
    { threshold: 7, text: 'ч уже красни', speed: 1000, size: 90 },
    { threshold: 15, text: 'В лютом ахуе 🤯', speed: 650, size: 70 },
    { threshold: 25, text: 'ебашит по всему полю ебать', speed: 350, size: 50 }
];

let currentMoodIndex = 0;
let moveSpeed = moods[0].speed; 
let currentSheepSize = moods[0].size; 

moodElement.textContent = moods[0].text;

startBtn.addEventListener('click', () => {
    startScreen.classList.add('hidden');
    
    bebe.style.opacity = '1';
    bebe.style.pointerEvents = 'auto';
    bebe.style.width = `${currentSheepSize}px`;
    bebe.style.height = `${currentSheepSize}px`;
    
    moveSheep();
    resetInterval();
});

function moveSheep() {
    const areaWidth = playArea.clientWidth;
    const areaHeight = playArea.clientHeight;

    const randomX = Math.floor(Math.random() * (areaWidth - currentSheepSize)) + (currentSheepSize / 2);
    const randomY = Math.floor(Math.random() * (areaHeight - currentSheepSize)) + (currentSheepSize / 2);

    bebe.style.left = `${randomX}px`;
    bebe.style.top = `${randomY}px`;
    
    const sheepImg = bebe.querySelector('.sheep-emoji');
    if (sheepImg) {
        const randomRotation = Math.floor(Math.random() * 60) - 30;
        sheepImg.style.transform = `rotate(${randomRotation}deg)`;
    }
}

function spawnFakeSheep(x, y) {
    const fake = document.createElement('div');
    fake.classList.add('sheep-bubble');
    fake.style.width = `${currentSheepSize}px`;
    fake.style.height = `${currentSheepSize}px`;
    fake.style.left = `${x}px`;
    fake.style.top = `${y}px`;
    fake.style.pointerEvents = 'none';
    fake.style.opacity = '0.6';
    fake.style.zIndex = '2';
    fake.innerHTML = `<img src="https://raw.githubusercontent.com/iamcal/emoji-data/master/img-apple-160/1f411.png" class="sheep-emoji">`;
    playArea.appendChild(fake);

    setTimeout(() => {
        const areaWidth = playArea.clientWidth;
        const areaHeight = playArea.clientHeight;
        const rx = Math.floor(Math.random() * (areaWidth - currentSheepSize));
        const ry = Math.floor(Math.random() * (areaHeight - currentSheepSize));
        fake.style.left = `${rx}px`;
        fake.style.top = `${ry}px`;
        fake.style.opacity = '0';
    }, 50);

    setTimeout(() => {
        fake.remove();
    }, 600);
}

function showBigText(msg) {
    const text = document.createElement('div');
    text.className = 'level-up-text';
    text.textContent = msg;
    text.style.fontFamily = "'Caveat', cursive";
    playArea.appendChild(text);
    setTimeout(() => {
        text.remove();
    }, 2500);
}

function createFloatingElement(x, y, isText = false) {
    const el = document.createElement('div');
    
    if (isText) {
        el.classList.add('floating-text');
        
        if (typeof floatingWords !== 'undefined') {
            el.innerHTML = floatingWords[Math.floor(Math.random() * floatingWords.length)];
        } else {
            el.innerHTML = 'бебе';
        }
    } else {
        el.classList.add('sparkle');
        const sparkles = ['1f338', '1f33c', '1f33f', '1f4ab', '2728', '1f31f', '1f343'];
        const randomHex = sparkles[Math.floor(Math.random() * sparkles.length)];
        
        el.style.backgroundImage = `url('https://raw.githubusercontent.com/iamcal/emoji-data/master/img-apple-160/${randomHex}.png')`;
        el.style.backgroundSize = 'contain';
        el.style.backgroundRepeat = 'no-repeat';
        
        const tx = (Math.random() - 0.5) * 150 + 'px';
        const ty = (Math.random() - 0.5) * 150 + 'px';
        el.style.setProperty('--tx', tx);
        el.style.setProperty('--ty', ty);
    }

    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    
    playArea.appendChild(el);

    setTimeout(() => {
        el.remove();
    }, 1000);
}

bebe.addEventListener('pointerdown', (e) => {
    score++;
    scoreElement.textContent = score;

    let newMoodIndex = 0;
    for(let i = moods.length - 1; i >= 0; i--) {
        if(score >= moods[i].threshold) {
            newMoodIndex = i;
            break;
        }
    }

    if (newMoodIndex !== currentMoodIndex) {
        currentMoodIndex = newMoodIndex;
        const newMood = moods[currentMoodIndex];
        
        moodElement.textContent = newMood.text;
        moveSpeed = newMood.speed;
        currentSheepSize = newMood.size;
        
        bebe.style.width = `${currentSheepSize}px`;
        bebe.style.height = `${currentSheepSize}px`;
        
        showBigText(newMood.text);
        
        if (currentMoodIndex === 3) {
            document.body.classList.add('crazy-bg');
        } else {
            document.body.classList.remove('crazy-bg');
        }
    }

    bebe.classList.remove('clicked');
    void bebe.offsetWidth; 
    bebe.classList.add('clicked');

    const rect = playArea.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    createFloatingElement(x, y, true);
    
    const numSparkles = Math.floor(Math.random() * 3) + 3;
    for (let i = 0; i < numSparkles; i++) {
        createFloatingElement(x, y, false);
    }

    if (currentMoodIndex === 3) {
        document.body.classList.remove('shake');
        void document.body.offsetWidth; 
        document.body.classList.add('shake');
        
        for(let i=0; i<3; i++) {
            spawnFakeSheep(x, y);
        }
    }

    moveSheep();
    resetInterval();
});

function resetInterval() {
    clearInterval(moveInterval);
    moveInterval = setInterval(moveSheep, moveSpeed);
}
