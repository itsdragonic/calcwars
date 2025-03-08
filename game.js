const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Player
const player = {
  x: 0,
  y: 0,
  radius: 20,
  color: "orange",
  speed: 5,
  health: 100,
  healthPotions: 5, // Start with 5 health potions
};

// Bullets
const bullets = [];
const bulletSpeed = 10;
let bulletColor = "white";
let isShooting = false;
let shootInterval = 200; // Time between shots in milliseconds
let lastShotTime = 0;

// Enemies
const enemies = [];
const enemyRadius = 15;
const enemySpeed = 1; // Reduced speed
const enemyRepulsionDistance = 40; // Distance at which enemies start repelling each other
const enemyRepulsionStrength = 0.5; // Strength of the repulsion force
let enemiesLeft = 0;

// Inventory
const hotbarSlots = document.querySelectorAll(".hotbar-slot");
let selectedSlot = 0;
const bulletColors = ["white", "red", "blue", "green", "yellow", "purple", "cyan", "magenta", "lime", "pink"];

// Camera
const camera = {
  x: 0,
  y: 0,
  lag: 0.1, // Adjust for smoother camera movement
};

// Game State
let gameOver = false;
let gameStarted = false;

// Screens
const startScreen = document.getElementById("startScreen");
const deathScreen = document.getElementById("deathScreen");

// Event Listeners
document.addEventListener("keydown", handleKeydown);
document.addEventListener("mousedown", handleMouseDown);
document.addEventListener("mouseup", handleMouseUp);
startScreen.addEventListener("click", startGame);
deathScreen.addEventListener("click", restartGame);
document.querySelector(".reset-button").addEventListener("click", resetGame);

function handleKeydown(e) {
  if (e.key >= "0" && e.key <= "9") {
    selectedSlot = parseInt(e.key);
    updateHotbar();
    bulletColor = bulletColors[selectedSlot];
  }
  if (e.key === "g" || e.key === "G") { // Use health potion
    useHealthPotion();
  }
}

function handleMouseDown(e) {
  if (e.button === 0) { // Left click
    isShooting = true;
  }
}

function handleMouseUp(e) {
  if (e.button === 0) { // Left click
    isShooting = false;
  }
}

function updateHotbar() {
  hotbarSlots.forEach((slot, index) => {
    slot.classList.toggle("selected", index === selectedSlot);
  });
}

// Use Health Potion
function useHealthPotion() {
  if (player.healthPotions > 0 && player.health < 100) {
    player.healthPotions--;
    player.health = Math.min(player.health + 10, 100); // Restore health, cap at 100
    document.getElementById("health").textContent = player.health;
    document.getElementById("healthPotionCount").textContent = player.healthPotions;
  }
}

// Spawn Enemies
function spawnEnemy() {
  const side = Math.floor(Math.random() * 4); // 0: top, 1: right, 2: bottom, 3: left
  let x, y;
  switch (side) {
    case 0: // Top
      x = player.x + (Math.random() - 0.5) * canvas.width * 2;
      y = player.y - canvas.height / 2 - enemyRadius;
      break;
    case 1: // Right
      x = player.x + canvas.width / 2 + enemyRadius;
      y = player.y + (Math.random() - 0.5) * canvas.height * 2;
      break;
    case 2: // Bottom
      x = player.x + (Math.random() - 0.5) * canvas.width * 2;
      y = player.y + canvas.height / 2 + enemyRadius;
      break;
    case 3: // Left
      x = player.x - canvas.width / 2 - enemyRadius;
      y = player.y + (Math.random() - 0.5) * canvas.height * 2;
      break;
  }
  enemies.push({ x, y, radius: enemyRadius, color: "red" });
  enemiesLeft++;
  document.getElementById("enemiesLeft").textContent = enemiesLeft;
}

// Start Game
function startGame() {
  startScreen.style.display = "none";
  gameStarted = true;
  resetGame();
  update();
}

// Restart Game
function restartGame() {
  deathScreen.style.display = "none";
  resetGame();
  update();
}

// Reset Game
function resetGame() {
  // Reset player
  player.x = 0;
  player.y = 0;
  player.health = 100;
  player.healthPotions = 5; // Reset health potions
  document.getElementById("health").textContent = player.health;
  document.getElementById("healthPotionCount").textContent = player.healthPotions;

  // Clear enemies and bullets
  enemies.length = 0;
  bullets.length = 0;
  enemiesLeft = 0;
  document.getElementById("enemiesLeft").textContent = enemiesLeft;

  // Reset game state
  gameOver = false;
}
// Update Game
function update() {
    if (!gameStarted || gameOver) return;
  
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  
    // Update camera position with lag
    camera.x += (player.x - camera.x) * camera.lag;
    camera.y += (player.y - camera.y) * camera.lag;
  
    // Translate the canvas to follow the player
    ctx.save();
    ctx.translate(-camera.x + canvas.width / 2, -camera.y + canvas.height / 2);
  
    // Draw player
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
    ctx.fillStyle = player.color;
    ctx.fill();
    ctx.closePath();
  
    // Move player
    if (keys["w"]) player.y -= player.speed;
    if (keys["s"]) player.y += player.speed;
    if (keys["a"]) player.x -= player.speed;
    if (keys["d"]) player.x += player.speed;
  
    // Shoot bullets
    if (isShooting && Date.now() - lastShotTime > shootInterval) {
      const angle = Math.atan2(
        mouseY - player.y + camera.y - canvas.height / 2,
        mouseX - player.x + camera.x - canvas.width / 2
      );
      bullets.push({
        x: player.x,
        y: player.y,
        dx: Math.cos(angle) * bulletSpeed,
        dy: Math.sin(angle) * bulletSpeed,
        color: bulletColor,
      });
      lastShotTime = Date.now();
    }
  
    // Draw and move bullets
    bullets.forEach((bullet, index) => {
      bullet.x += bullet.dx;
      bullet.y += bullet.dy;
  
      // Remove bullets off-screen
      if (
        Math.abs(bullet.x - player.x) > canvas.width * 2 ||
        Math.abs(bullet.y - player.y) > canvas.height * 2
      ) {
        bullets.splice(index, 1);
        return;
      }
  
      // Draw bullet
      ctx.beginPath();
      ctx.arc(bullet.x, bullet.y, 5, 0, Math.PI * 2);
      ctx.fillStyle = bullet.color;
      ctx.fill();
      ctx.closePath();
    });
  
    // Draw and move enemies
    enemies.forEach((enemy, index) => {
      // Move toward the player
      const angleToPlayer = Math.atan2(player.y - enemy.y, player.x - enemy.x);
      enemy.x += Math.cos(angleToPlayer) * enemySpeed;
      enemy.y += Math.sin(angleToPlayer) * enemySpeed;
  
      // Repel from other enemies
      enemies.forEach((otherEnemy, otherIndex) => {
        if (index === otherIndex) return; // Skip self
  
        const dx = enemy.x - otherEnemy.x;
        const dy = enemy.y - otherEnemy.y;
        const distance = Math.hypot(dx, dy);
  
        if (distance < enemyRepulsionDistance) {
          // Push away from the other enemy
          const force = (enemyRepulsionDistance - distance) / enemyRepulsionDistance;
          enemy.x += (dx / distance) * force * enemyRepulsionStrength;
          enemy.y += (dy / distance) * force * enemyRepulsionStrength;
        }
      });
  
      // Draw enemy
      ctx.beginPath();
      ctx.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2);
      ctx.fillStyle = enemy.color;
      ctx.fill();
      ctx.closePath();
  
      // Check collision with player
      const distToPlayer = Math.hypot(player.x - enemy.x, player.y - enemy.y);
      if (distToPlayer < player.radius + enemy.radius) {
        player.health -= 10;
        document.getElementById("health").textContent = player.health;
        enemies.splice(index, 1);
        enemiesLeft--;
        document.getElementById("enemiesLeft").textContent = enemiesLeft;
        if (player.health <= 0) {
          gameOver = true;
          deathScreen.style.display = "flex";
        }
      }
  
      // Check collision with bullets
      bullets.forEach((bullet, bulletIndex) => {
        const distToBullet = Math.hypot(bullet.x - enemy.x, bullet.y - enemy.y);
        if (distToBullet < enemy.radius) {
          enemies.splice(index, 1);
          bullets.splice(bulletIndex, 1);
          enemiesLeft--;
          document.getElementById("enemiesLeft").textContent = enemiesLeft;
        }
      });
    });
  
    // Restore canvas translation
    ctx.restore();
  
    // Spawn enemies (reduced spawn rate)
    if (Math.random() < 0.01) { // Reduced spawn rate
      spawnEnemy();
    }
  
    requestAnimationFrame(update);
  }
  
// Keyboard input
const keys = {};
document.addEventListener("keydown", (e) => {
  keys[e.key] = true;
});
document.addEventListener("keyup", (e) => {
  keys[e.key] = false;
});

// Mouse position
let mouseX = 0;
let mouseY = 0;
document.addEventListener("mousemove", (e) => {
  mouseX = e.clientX;
  mouseY = e.clientY;
});

// Initialize
updateHotbar();