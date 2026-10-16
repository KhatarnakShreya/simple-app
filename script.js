const canvas = document.querySelector("#game-canvas");
const context = canvas.getContext("2d");
const scoreElement = document.querySelector("#score");
const highScoreElement = document.querySelector("#high-score");
const statusText = document.querySelector("#status-text");
const statusDot = document.querySelector("#status-dot");
const message = document.querySelector("#message");
const messageTitle = document.querySelector("#message-title");
const messageCopy = document.querySelector("#message-copy");
const restartButton = document.querySelector("#restart-button");
const pauseButton = document.querySelector("#pause-button");

const gridSize = 24;
const cellSize = canvas.width / gridSize;
const tickRate = 105;
let snake;
let food;
let direction;
let queuedDirection;
let score;
let highScore = Number(localStorage.getItem("neon-snake-best") || 0);
let gameState = "live";
let lastTick = 0;
let animationFrame;
let touchStart;

highScoreElement.textContent = String(highScore).padStart(3, "0");

function randomFood() {
  let candidate;
  do {
    candidate = { x: Math.floor(Math.random() * gridSize), y: Math.floor(Math.random() * gridSize) };
  } while (snake.some((segment) => segment.x === candidate.x && segment.y === candidate.y));
  return candidate;
}

function startGame() {
  snake = [{ x: 12, y: 12 }, { x: 11, y: 12 }, { x: 10, y: 12 }];
  direction = { x: 1, y: 0 };
  queuedDirection = direction;
  score = 0;
  food = randomFood();
  gameState = "live";
  updateStatus();
  message.classList.add("is-hidden");
  updateScore();
}

function updateScore() {
  scoreElement.textContent = String(score).padStart(3, "0");
  highScoreElement.textContent = String(highScore).padStart(3, "0");
}

function updateStatus() {
  const labels = { live: "LIVE", paused: "PAUSED", over: "ENDED" };
  statusText.textContent = labels[gameState];
  statusDot.className = `status-dot is-${gameState}`;
  pauseButton.setAttribute("aria-label", gameState === "paused" ? "Resume game" : "Pause game");
}

function setDirection(nextDirection) {
  if (gameState === "over") return;
  const movesBackwards = nextDirection.x + direction.x === 0 && nextDirection.y + direction.y === 0;
  if (!movesBackwards) queuedDirection = nextDirection;
}

function tick() {
  direction = queuedDirection;
  const head = { x: snake[0].x + direction.x, y: snake[0].y + direction.y };
  const ateFood = head.x === food.x && head.y === food.y;
  const bodyToCheck = ateFood ? snake : snake.slice(0, -1);
  const hitWall = head.x < 0 || head.x >= gridSize || head.y < 0 || head.y >= gridSize;
  const hitSelf = bodyToCheck.some((segment) => segment.x === head.x && segment.y === head.y);
  if (hitWall || hitSelf) return endGame();
  snake.unshift(head);
  if (ateFood) {
    score += 10;
    if (score > highScore) {
      highScore = score;
      localStorage.setItem("neon-snake-best", highScore);
    }
    food = randomFood();
  } else {
    snake.pop();
  }
  updateScore();
}

function endGame() {
  gameState = "over";
  updateStatus();
  messageTitle.textContent = "Run complete";
  messageCopy.textContent = `Your run ended at ${String(score).padStart(3, "0")} points.`;
  message.classList.remove("is-hidden");
}

function togglePause() {
  if (gameState === "over") return;
  gameState = gameState === "paused" ? "live" : "paused";
  updateStatus();
}

function draw() {
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "#11171c";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.strokeStyle = "rgba(242, 238, 229, 0.045)";
  context.lineWidth = 1;
  for (let index = 1; index < gridSize; index += 1) {
    context.beginPath(); context.moveTo(index * cellSize, 0); context.lineTo(index * cellSize, canvas.height); context.stroke();
    context.beginPath(); context.moveTo(0, index * cellSize); context.lineTo(canvas.width, index * cellSize); context.stroke();
  }
  context.fillStyle = "#ff715b";
  context.shadowColor = "#ff715b";
  context.shadowBlur = 18;
  context.beginPath(); context.arc((food.x + 0.5) * cellSize, (food.y + 0.5) * cellSize, cellSize * 0.28, 0, Math.PI * 2); context.fill();
  context.shadowBlur = 0;
  snake.forEach((segment, index) => {
    context.fillStyle = index === 0 ? "#f2eee5" : "#d4f542";
    const inset = index === 0 ? 2 : 3;
    context.fillRect(segment.x * cellSize + inset, segment.y * cellSize + inset, cellSize - inset * 2, cellSize - inset * 2);
  });
}

function loop(timestamp) {
  if (gameState === "live" && timestamp - lastTick >= tickRate) { tick(); lastTick = timestamp; }
  draw();
  animationFrame = requestAnimationFrame(loop);
}

document.addEventListener("keydown", (event) => {
  const directions = { ArrowUp: { x: 0, y: -1 }, ArrowDown: { x: 0, y: 1 }, ArrowLeft: { x: -1, y: 0 }, ArrowRight: { x: 1, y: 0 } };
  if (directions[event.key]) { event.preventDefault(); setDirection(directions[event.key]); }
  if (event.code === "Space") { event.preventDefault(); togglePause(); }
});

document.querySelectorAll("[data-direction]").forEach((button) => button.addEventListener("click", () => {
  const directions = { up: { x: 0, y: -1 }, down: { x: 0, y: 1 }, left: { x: -1, y: 0 }, right: { x: 1, y: 0 } };
  setDirection(directions[button.dataset.direction]);
}));

canvas.addEventListener("touchstart", (event) => { touchStart = event.changedTouches[0]; }, { passive: true });
canvas.addEventListener("touchend", (event) => {
  if (!touchStart) return;
  const touch = event.changedTouches[0];
  const deltaX = touch.clientX - touchStart.clientX;
  const deltaY = touch.clientY - touchStart.clientY;
  if (Math.max(Math.abs(deltaX), Math.abs(deltaY)) < 20) return;
  if (Math.abs(deltaX) > Math.abs(deltaY)) setDirection({ x: Math.sign(deltaX), y: 0 });
  else setDirection({ x: 0, y: Math.sign(deltaY) });
  touchStart = null;
}, { passive: true });

pauseButton.addEventListener("click", togglePause);
restartButton.addEventListener("click", startGame);
startGame();
animationFrame = requestAnimationFrame(loop);