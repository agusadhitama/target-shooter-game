const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startBtn = document.getElementById('startBtn');
const scoreDisplay = document.getElementById('scoreDisplay');

let leaderboardDiv = document.createElement('div');
leaderboardDiv.id = 'leaderboard';
document.body.appendChild(leaderboardDiv);

const joystickBase = document.getElementById('joystickBase');
const joystickKnob = document.getElementById('joystickKnob');

const bgImage = new Image();
bgImage.src = 'assets/background.jpg';
const playerImg = new Image();
playerImg.src = 'assets/player.png';

const shootSound = new Audio('assets/shoot.mp3');
const powerUpSound = new Audio('assets/powerup.mp3');

let player = { x: 160, y: 560, width: 40, height: 40 };
let bullets = [], enemies = [], powerUps = [], particles = [];
let gameLoopInterval, shootInterval;
let score = 0;
let joystickActive = false, joystickStart={x:0,y:0}, moveX=0;
let shieldActive=false;

// START GAME
startBtn.addEventListener('click', ()=>{
    startBtn.style.display='none';
    gameLoopInterval = setInterval(gameLoop,30);
    shootInterval = setInterval(autoShoot,300);
    setInterval(spawnEnemy,1000);
    setInterval(spawnPowerUp,15000);
    updateLeaderboard();
});

// AUTO SHOOT
function autoShoot(){ bullets.push({x:player.x+15,y:player.y,width:10,height:20}); shootSound.currentTime=0; shootSound.play(); }

// JOYSTICK
joystickBase.addEventListener('touchstart',e=>{ joystickActive=true; joystickStart={x:e.touches[0].clientX,y:e.touches[0].clientY}; });
joystickBase.addEventListener('touchmove',e=>{ if(!joystickActive)return; moveX=e.touches[0].clientX-joystickStart.x; const radius=40; const dist=Math.min(Math.abs(moveX),radius); joystickKnob.style.left=60+(moveX>0?dist:-dist)+'px'; });
joystickBase.addEventListener('touchend',()=>{ joystickActive=false; moveX=0; joystickKnob.style.left='60px'; });

// ENEMIES
function spawnEnemy(){ const type=Math.random()<0.5?1:2; const speed=type===1?4:2; const size=type===1?40:60; const x=Math.random()*(canvas.width-size); const color=type===1?'green':'orange'; enemies.push({x,y:0,width:size,height:size,color,speed}); }

// POWER-UPS
function spawnPowerUp(){ const types=['score','rapid','shield']; const type=types[Math.floor(Math.random()*types.length)]; const x=Math.random()*(canvas.width-30); let color='blue'; if(type==='rapid')color='red'; if(type==='shield')color='green'; powerUps.push({x,y:0,width:30,height:30,type,color}); }

// COLLISION
function checkCollision(a,b){ return !(b.x>a.x+a.width || b.x+b.width<a.x || b.y>a.y+a.height || b.y+b.height<a.y); }

// PARTICLES
function spawnParticles(x,y,color){ for(let i=0;i<15;i++){ particles.push({x:x+Math.random()*40,y:y+Math.random()*40,radius:Math.random()*4+2,color,dx:(Math.random()-0.5)*6,dy:(Math.random()-0.5)*6,life:40}); } }
function drawParticles(){ for(let i=particles.length-1;i>=0;i--){ const p=particles[i]; ctx.beginPath(); ctx.arc(p.x,p.y,p.radius,0,Math.PI*2); ctx.fillStyle=p.color; ctx.fill(); p.x+=p.dx; p.y+=p.dy; p.dy+=0.1; p.radius*=0.95; p.life--; if(p.life<=0||p.radius<0.5) particles.splice(i,1); } }

// POWER-UP EFFECTS
function activateRapid(){ clearInterval(shootInterval); shootInterval=setInterval(autoShoot,150); setTimeout(()=>{shootInterval=setInterval(autoShoot,300);},5000); }
function activateShield(){ shieldActive=true; setTimeout(()=>{shieldActive=false;},5000); }

// LEADERBOARD
function updateLeaderboard(){ let lb=JSON.parse(localStorage.getItem('leaderboard'))||[]; lb.sort((a,b)=>b-a); if(lb.length>5)lb=lb.slice(0,5); leaderboardDiv.innerHTML=`<h3>Top Scores</h3><ul>${lb.map(s=>`<li>${s}</li>`).join('')}</ul>`; }
function saveScore(){ let lb=JSON.parse(localStorage.getItem('leaderboard'))||[]; lb.push(score); localStorage.setItem('leaderboard',JSON.stringify(lb)); updateLeaderboard(); }

// GAME LOOP
function gameLoop(){
    ctx.drawImage(bgImage,0,0,canvas.width,canvas.height);
    player.x+=moveX*0.3; if(player.x<0)player.x=0; if(player.x+player.width>canvas.width)player.x=canvas.width-player.width;
    ctx.drawImage(playerImg,player.x,player.y,player.width,player.height);
    if(shieldActive){ ctx.beginPath(); ctx.arc(player.x+player.width/2,player.y+player.height/2,player.width,0,Math.PI*2); ctx.strokeStyle='rgba(0,255,255,0.7)'; ctx.lineWidth=4; ctx.stroke(); }
    bullets.forEach((b,i)=>{ b.y-=10; ctx.fillStyle='yellow'; ctx.fillRect(b.x,b.y,b.width,b.height); if(b.y<0) bullets.splice(i,1); });
    enemies.forEach((e,i)=>{ e.y+=e.speed; ctx.fillStyle=e.color; ctx.fillRect(e.x,e.y,e.width,e.height);
        bullets.forEach((b,j)=>{ if(checkCollision(b,e)){ bullets.splice(j,1); enemies.splice(i,1); score+=10; scoreDisplay.innerText='Score: '+score; spawnParticles(e.x,e.y,e.color); } });
        if(checkCollision(player,e)&&!shieldActive){ clearInterval(gameLoopInterval); clearInterval(shootInterval); saveScore(); alert('Game Over! Score: '+score); location.reload(); }
        if(e.y>canvas.height) enemies.splice(i,1);
    });
    powerUps.forEach((p,i)=>{ p.y+=3; ctx.fillStyle=p.color; ctx.fillRect(p.x,p.y,p.width,p.height); if(checkCollision(player,p)){ if(p.type==='score'){score+=50;} else if(p.type==='rapid'){activateRapid();} else if(p.type==='shield'){activateShield();} powerUpSound.currentTime=0; powerUpSound.play(); powerUps.splice(i,1); scoreDisplay.innerText='Score: '+score; } if(p.y>canvas.height) powerUps.splice(i,1); });
    drawParticles();
}