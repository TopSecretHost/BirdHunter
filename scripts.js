document.addEventListener('DOMContentLoaded', () => {
    const gameContainer = document.getElementById('game-container');
    const scope = document.getElementById('scope');
    const canvas = document.getElementById('game-canvas');
    const context = canvas.getContext('2d');
    const ammoCountDisplay = document.getElementById('ammo-count');
    const scoreDisplay = document.getElementById('score');
    const timerDisplay = document.getElementById('timer');
    const reloadingDisplay = document.getElementById('reloading');
    const mainMenu = document.getElementById('main-menu');
    const startGameButton = document.getElementById('start-game');
    const quitGameButton = document.getElementById('quit-game');
    const hud = document.getElementById('hud');
    const gameMessage = document.getElementById('game-message');
    const endGamePopup = document.getElementById('end-game-popup');
    const finalScoreDisplay = document.getElementById('final-score');
    const closePopupButton = document.getElementById('close-popup');

    canvas.width = gameContainer.clientWidth;
    canvas.height = gameContainer.clientHeight;

    let ammoCount = 10;
    let score = 0;
    let timeRemaining = 60;
    let isReloading = false;
    let gameInterval, timerInterval;
    let gameLoopRunning = false;
    let isEndGamePopupVisible = false;

    const birdImages = [];
    for (let i = 1; i <= 6; i++) {
        const img = new Image();
        img.src = `bird/bird_${i}.png`;
        birdImages.push(img);
    }
    let birdFrameIndex = 0;
    let birdFrameInterval = 0;

    const bird = {
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        initialSpeed: 1.5,
        speedX: 0,
        speedY: 0,
        resetSpeed: function() {
            this.speedX = (Math.random() > 0.5 ? 1 : -1) * this.initialSpeed;
            this.speedY = (Math.random() > 0.5 ? 1 : -1) * this.initialSpeed;
        }
    };

    function initBird() {
        bird.x = Math.random() * (canvas.width - bird.width);
        bird.y = Math.random() * (canvas.height - bird.height);
        bird.resetSpeed();
        drawBird(); // Draw the bird immediately after initialization to ensure it's correct
    }

    function drawBird() {
        context.clearRect(0, 0, canvas.width, canvas.height);

        context.save();
        context.translate(bird.x + bird.width / 2, bird.y + bird.height / 2);

        if (bird.speedX < 0) {
            context.scale(-1, 1);
        }

        const angle = Math.atan2(bird.speedY, Math.abs(bird.speedX));
        context.rotate(angle);

        context.drawImage(birdImages[birdFrameIndex], -bird.width / 2, -bird.height / 2, bird.width, bird.height);

        context.restore();

        birdFrameInterval++;
        if (birdFrameInterval % 10 === 0) {
            birdFrameIndex = (birdFrameIndex + 1) % birdImages.length;
            birdFrameInterval = 0;
        }
    }

    function updateBird() {
        bird.x += bird.speedX;
        bird.y += bird.speedY;

        if (bird.x <= 0 || bird.x + bird.width >= canvas.width) {
            bird.speedX *= -1;
        }
        if (bird.y <= 0 || bird.y + bird.height >= canvas.height) {
            bird.speedY *= -1;
        }
    }

    function gameLoop() {
        if (!gameLoopRunning) return;
        updateBird();
        drawBird();
        requestAnimationFrame(gameLoop);
    }

    function startGame() {
        resetGame();

        // Change background to game background
        gameContainer.style.background = "url('extras/bg1.svg') no-repeat center center/cover";

        hud.style.display = 'block';
        mainMenu.style.display = 'none';
        endGamePopup.classList.add('hidden');
        isEndGamePopupVisible = false;

        let countdown = 3;
        function countdownStep() {
            if (countdown > 0) {
                showGameMessage(`Game starting in ${countdown}...`);
                countdown--;
                setTimeout(countdownStep, 1000);
            } else {
                showGameMessage('Go!');
                gameLoopRunning = true;
                requestAnimationFrame(gameLoop);
                timerInterval = setInterval(updateTimer, 1000);
                setTimeout(() => showGameMessage(''), 500);
            }
        }

        countdownStep();
    }

    function updateTimer() {
        timeRemaining--;
        timerDisplay.textContent = `Time: ${timeRemaining}s`;

        if (timeRemaining <= 0) {
            endGame();
        }
    }

    function endGame() {
        gameLoopRunning = false;
        clearInterval(timerInterval);
        showEndGamePopup(`Game Over! Your score: ${score}`);
        isEndGamePopupVisible = true;
        // Hide game message when game ends
        gameMessage.style.display = 'none';
    }

    function resetGame() {
        score = 0;
        ammoCount = 10;
        timeRemaining = 60;
        bird.initialSpeed = 1.5; // Reset bird speed to initial value
        bird.resetSpeed();
        scoreDisplay.textContent = `Score: ${score}`;
        ammoCountDisplay.textContent = `Ammo: ${ammoCount}`;
        timerDisplay.textContent = `Time: ${timeRemaining}s`;
        hud.style.display = 'none';

        // Show main menu only if the end game popup is not visible
        if (!isEndGamePopupVisible) {
            mainMenu.style.display = 'flex';
            gameContainer.style.background = "url('extras/bg2.svg') no-repeat center center/cover";
        }

        // Clear any existing game intervals
        if (timerInterval) clearInterval(timerInterval);
        gameLoopRunning = false;

        // Clear the canvas
        context.clearRect(0, 0, canvas.width, canvas.height);

        // Initialize the bird position and draw it
        initBird();
    }

    function showGameMessage(message) {
        gameMessage.textContent = message;
        gameMessage.classList.remove('hidden');
        gameMessage.style.opacity = '1';
        gameMessage.style.display = 'block'; // Ensure game message is shown
    }

    function showEndGamePopup(message) {
        finalScoreDisplay.textContent = score;
        endGamePopup.classList.remove('hidden');
    }

    closePopupButton.addEventListener('click', () => {
        endGamePopup.classList.add('hidden');
        isEndGamePopupVisible = false;
        // Now show the main menu
        mainMenu.style.display = 'flex';
        gameContainer.style.background = "url('extras/bg2.svg') no-repeat center center/cover";
    });

    gameContainer.addEventListener('mousemove', (e) => {
        const rect = gameContainer.getBoundingClientRect();
        const x = e.clientX - rect.left - (scope.offsetWidth / 2);
        const y = e.clientY - rect.top - (scope.offsetHeight / 2);
        scope.style.transform = `translate(${x}px, ${y}px)`;
    });

    gameContainer.addEventListener('click', (e) => {
        if (isReloading || timeRemaining > 59) return; // Prevent misfires during countdown

        if (ammoCount <= 0) {
            showGameMessage('Out of ammo! Reload by holding Shift and clicking.');
            return;
        }

        const shootSound = new Audio('sounds/gs1.mp3');
        shootSound.play();
        ammoCount--;
        ammoCountDisplay.textContent = `Ammo: ${ammoCount}`;

        const rect = gameContainer.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (x >= bird.x && x <= bird.x + bird.width && y >= bird.y && y <= bird.y + bird.height) {
            score++;
            scoreDisplay.textContent = `Score: ${score}`;
            showGameMessage('Hit!');
            initBird();
        } else {
            showGameMessage('Miss!');
        }
    });

    gameContainer.addEventListener('click', (e) => {
        if (e.shiftKey) {
            reload();
        }
    });

    function reload() {
        if (isReloading) return;

        isReloading = true;
        showGameMessage('Reloading...');
        reloadingDisplay.style.display = 'block';
        const reloadSound = new Audio('sounds/rl1.mp3');
        reloadSound.play();

        setTimeout(() => {
            ammoCount = 10;
            ammoCountDisplay.textContent = `Ammo: ${ammoCount}`;
            isReloading = false;
            reloadingDisplay.style.display = 'none';
            showGameMessage('Reloaded');
        }, 2000); // 2 seconds reload time
    }

    startGameButton.addEventListener('click', startGame);
    quitGameButton.addEventListener('click', () => {
        if (confirm('Are you sure you want to quit the game?')) {
            window.close();
        }
    });

    resetGame();
});
