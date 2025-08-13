/* ======= 基本定数 ======= */
const TZ = 16;                    // 1タイル=16px
const GRAV = 0.0022;              // 重力
const JUMP = -2.48;               // ジャンプ初速（400%）
const DASH_JUMP = -3.4;           // ダッシュジャンプ初速（400%）
const SPD = 0.56;                 // 地上移動速度（400%）
const DASH_SPD = 0.96;            // ダッシュ速度（400%）
const FRI = 0.86;                 // 減衰
const CAM_W = 800, CAM_H = 240;

/* ======= ゲーム状態 ======= */
let currentStage = 1;
let currentWorld = 1;
let stageTransition = false;
let transitionTimer = 0;

/* ======= 爆弾システム ======= */
const bombs = [];
const explosions = [];

function createBomb(x, y, direction) {
    bombs.push({
        x: x,
        y: y,
        dx: direction * 0.3,
        dy: -0.5,
        timer: 120, // 2秒で爆発
        w: 8,
        h: 8
    });
}

function createExplosion(x, y) {
    explosions.push({
        x: x - 16,
        y: y - 16,
        w: 32,
        h: 32,
        timer: 30,
        maxTimer: 30
    });
    
    // パーティクル効果
    createParticle(x, y, 'explosion');
    playSound('explosion', x, y);
    shakeCamera(8);
}

/* ======= パーティクルエフェクト ======= */
const particles = [];
function createParticle(x, y, type = 'coin') {
    const colors = {
        coin: ['#FFD700', '#FFA500', '#FF8C00'],
        death: ['#FF0000', '#FF4500', '#FF6347'],
        jump: ['#87CEEB', '#B0E0E6', '#ADD8E6'],
        explosion: ['#FF4500', '#FF6347', '#FFD700', '#FFA500'],
        flower: ['#FFB6C1', '#FF69B4', '#FF1493']
    };
    
    const particleCount = type === 'explosion' ? 12 : 8;
    for (let i = 0; i < particleCount; i++) {
        particles.push({
            x: x,
            y: y,
            dx: (Math.random() - 0.5) * (type === 'explosion' ? 0.8 : 0.5),
            dy: (Math.random() - 0.5) * (type === 'explosion' ? 0.8 : 0.5) - 0.2,
            color: colors[type][Math.floor(Math.random() * colors[type].length)],
            life: type === 'explosion' ? 80 : 100,
            maxLife: type === 'explosion' ? 80 : 100,
            size: Math.random() * (type === 'explosion' ? 6 : 4) + 2
        });
    }
}

/* ======= サウンドエフェクト（視覚的） ======= */
const soundEffects = [];
function playSound(type, x, y) {
    const effects = {
        jump: { text: '🚀', color: '#00BFFF', size: 16 },
        coin: { text: '💰', color: '#FFD700', size: 20 },
        enemy: { text: '💥', color: '#FF4500', size: 24 },
        powerup: { text: '⭐', color: '#FFD700', size: 28 },
        explosion: { text: '💥', color: '#FF0000', size: 32 },
        flower: { text: '🌸', color: '#FF69B4', size: 24 }
    };
    
    if (effects[type]) {
        soundEffects.push({
            ...effects[type],
            x: x,
            y: y,
            life: 60,
            dy: -0.5
        });
    }
}

/* ======= マップ（0:空,1:地面,2:ブロック,3:コイン,4:敵,5:旗,6:パワーアップ,7:花） ======= */
const W = 250, H = 15;
let map = new Uint8Array(W * H).fill(0);

function at(x, y) { return map[y * W + x] | 0 }
function set(x, y, v) { map[y * W + x] = v }
function rectFill(x0, y0, x1, y1, v) {
    for (let y = y0; y <= y1; y++) {
        for (let x = x0; x <= x1; x++) {
            set(x, y, v);
        }
    }
}

function generateStage(stage, world) {
    map.fill(0);
    
    // 基本地面
    for (let x = 0; x < W; x++) { 
        rectFill(x, 12, x, 14, 1);
    }
    
    // ステージに応じた地形生成
    if (stage === 1) {
        // ステージ1-1: 基本ステージ
        rectFill(8, 11, 25, 11, 1); 
        rectFill(30, 10, 45, 10, 1); 
        rectFill(50, 9, 65, 9, 1);
        rectFill(70, 8, 85, 8, 1);
        rectFill(90, 9, 105, 9, 1);
        rectFill(110, 10, 125, 10, 1);
        rectFill(130, 8, 145, 8, 1);
        rectFill(150, 7, 165, 7, 1);
        rectFill(170, 6, 185, 6, 1);
        rectFill(190, 8, 205, 8, 1);
        
        // アイテムとブロック
        set(12, 8, 2); set(13, 8, 2); set(14, 8, 2); set(13, 5, 3);
        set(22, 9, 3); set(23, 9, 3); set(24, 9, 3); set(25, 9, 3);
        set(35, 7, 2); set(36, 7, 3); set(37, 7, 2); set(38, 4, 6);
        set(55, 6, 3); set(56, 6, 3); set(57, 6, 3);
        set(75, 5, 2); set(76, 5, 7); set(77, 5, 2); // 花を配置
        set(95, 6, 3); set(96, 6, 3);
        set(115, 7, 2); set(116, 7, 6); set(117, 7, 2);
        set(135, 5, 3); set(136, 5, 7); set(137, 5, 3); // 花を配置
        set(155, 4, 2); set(156, 4, 3); set(157, 4, 2);
        set(175, 3, 3); set(176, 3, 7); // 花を配置
        
        // 敵配置（基本ステージ）
        set(50, 11, 4); set(80, 7, 4); set(120, 9, 4); 
        set(160, 6, 4); set(200, 7, 4); set(40, 11, 4); 
        set(100, 8, 4); set(180, 7, 4);
        
        // 穴
        rectFill(65, 12, 68, 14, 0); 
        rectFill(105, 12, 108, 14, 0);
        rectFill(185, 12, 188, 14, 0);
        
    } else if (stage === 2) {
        // ステージ1-2: より難しいステージ
        rectFill(10, 11, 20, 11, 1);
        rectFill(25, 9, 35, 9, 1);
        rectFill(40, 7, 50, 7, 1);
        rectFill(55, 10, 70, 10, 1);
        rectFill(80, 6, 95, 6, 1);
        rectFill(105, 8, 120, 8, 1);
        rectFill(130, 5, 145, 5, 1);
        rectFill(155, 9, 170, 9, 1);
        rectFill(180, 4, 195, 4, 1);
        
        // より多くのアイテム
        set(15, 8, 3); set(16, 8, 3); set(17, 8, 7); // 花
        set(30, 6, 2); set(31, 6, 7); set(32, 6, 2); // 花
        set(45, 4, 3); set(46, 4, 6); set(47, 4, 3);
        set(62, 7, 7); set(63, 7, 3); set(64, 7, 7); // 花
        set(88, 3, 2); set(89, 3, 7); set(90, 3, 2); // 花
        set(112, 5, 3); set(113, 5, 7); set(114, 5, 3); // 花
        set(138, 2, 6); set(139, 2, 7); set(140, 2, 6); // 花
        set(162, 6, 7); set(163, 6, 3); set(164, 6, 7); // 花
        set(187, 1, 7); set(188, 1, 6); set(189, 1, 7); // 花
        
        // より多くの敵（様々なタイプ）
        set(25, 11, 4); set(55, 11, 4); set(85, 11, 4);
        set(115, 11, 4); set(145, 11, 4); set(175, 11, 4);
        set(35, 8, 4); set(75, 9, 4); set(125, 7, 4);
        set(155, 8, 4); set(185, 3, 4); set(205, 7, 4);
        
        // 大きな穴
        rectFill(70, 12, 75, 14, 0);
        rectFill(95, 12, 100, 14, 0);
        rectFill(150, 12, 154, 14, 0);
        rectFill(195, 12, 200, 14, 0);
    }
    
    // ゴール旗柱
    rectFill(230, 5, 230, 11, 5);
}

/* ======= プレイヤーと敵 ======= */
const player = {
    x: TZ * 3, 
    y: TZ * 8, 
    w: 12, 
    h: 14, 
    dx: 0, 
    dy: 0, 
    air: true, 
    dir: 1, 
    coins: 0, 
    lives: 3,
    score: 0,
    dead: false, 
    win: false,
    invulnerable: 0,
    powered: false,
    powerTimer: 0,
    bombs: 0 // 爆弾の数
};

let enemies = [];

function createEnemies() {
    enemies = [];
    for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
            if (at(x, y) == 4) {
                const rand = Math.random();
                let enemyType = 'normal';
                
                if (rand < 0.25) enemyType = 'fast';      // 高速敵
                else if (rand < 0.5) enemyType = 'spike';  // トゲ敵
                else if (rand < 0.75) enemyType = 'flying'; // 飛行敵
                else if (rand < 0.9) enemyType = 'jumper'; // ジャンプ敵
                
                enemies.push({
                    x: x * TZ + 2,
                    y: y * TZ - 2,
                    w: 12,
                    h: 12,
                    dx: 0.06 * (Math.random() < 0.5 ? -1 : 1),
                    dy: 0,
                    range: [x * TZ - 48, x * TZ + 48],
                    alive: true,
                    type: enemyType,
                    animTimer: 0,
                    jumpTimer: 0,
                    originalY: y * TZ - 2
                });
                set(x, y, 0);
            }
        }
    }
}

/* ======= 入力制御 ======= */
const keys = {};

// キーボード入力
addEventListener('keydown', e => keys[e.key] = true);
addEventListener('keyup', e => keys[e.key] = false);

// タッチ入力
const touchControls = {
    left: false,
    right: false,
    jump: false,
    dash: false,
    bomb: false
};

// タッチボタンの設定
document.addEventListener('DOMContentLoaded', () => {
    const btnLeft = document.getElementById('btn-left');
    const btnRight = document.getElementById('btn-right');
    const btnJump = document.getElementById('btn-jump');
    const btnDash = document.getElementById('btn-dash');
    const btnBomb = document.getElementById('btn-bomb');

    function setupButton(btn, control) {
        if (!btn) return;
        
        // タッチイベント
        btn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            touchControls[control] = true;
        });
        btn.addEventListener('touchend', (e) => {
            e.preventDefault();
            touchControls[control] = false;
        });
        
        // マウスイベント（PC でもボタンを使える）
        btn.addEventListener('mousedown', (e) => {
            e.preventDefault();
            touchControls[control] = true;
        });
        btn.addEventListener('mouseup', (e) => {
            e.preventDefault();
            touchControls[control] = false;
        });
    }

    setupButton(btnLeft, 'left');
    setupButton(btnRight, 'right');
    setupButton(btnJump, 'jump');
    setupButton(btnDash, 'dash');
    setupButton(btnBomb, 'bomb');
});

/* ======= 当たり判定 ======= */
function tileAt(px, py) {
    const x = Math.floor(px / TZ), y = Math.floor(py / TZ);
    if (x < 0 || y < 0 || x >= W || y >= H) return 1;
    return at(x, y);
}

function collideRectMap(ent) {
    // X方向の移動
    let nx = ent.x + ent.dx, ny = ent.y;
    
    if (ent.dx > 0) {
        const right = nx + ent.w;
        if (solid(right, ny, ent.h)) { 
            nx = Math.floor((right) / TZ) * TZ - ent.w - 0.01; 
            ent.dx = 0; 
        }
    } else if (ent.dx < 0) {
        const left = nx;
        if (solid(left, ny, ent.h)) { 
            nx = Math.floor((left) / TZ + 1) * TZ + 0.01; 
            ent.dx = 0; 
        }
    }
    
    // Y方向の移動
    ny += ent.dy;
    if (ent.dy > 0) {
        const foot = ny + ent.h;
        if (solid(nx, foot, 1)) { 
            ny = Math.floor(foot / TZ) * TZ - ent.h - 0.01; 
            ent.dy = 0; 
            ent.air = false; 
        }
    } else if (ent.dy < 0) {
        const head = ny;
        const hit = solid(nx, head, 1, true);
        if (hit) { 
            ny = Math.floor(head / TZ + 1) * TZ + 0.01; 
            ent.dy = 0; 
            onHitBlock(hit); 
        }
    }
    ent.x = nx; 
    ent.y = ny;
}

function solid(x, y, h, breakable = false) {
    for (let yy = y; yy < y + h; yy += TZ / 2) {
        const t = tileAt(x, yy);
        if (t == 1 || t == 2 || t == 5) {
            return breakable ? {x: Math.floor(x / TZ), y: Math.floor(yy / TZ), t} : true;
        }
    }
    return false;
}

function onHitBlock(info) {
    if (!info || info.t != 2) return;
    const idx = info.y * W + info.x;
    if (map[idx] == 2) { 
        map[idx] = 0; 
        spawnCoin(info.x * TZ + 4, info.y * TZ - 8);
        createParticle(info.x * TZ + 8, info.y * TZ + 8, 'coin');
        playSound('coin', info.x * TZ, info.y * TZ);
        player.score += 200;
    }
}

/* ======= コイン・演出 ======= */
const coinsFX = [];
function spawnCoin(x, y) { 
    coinsFX.push({x, y, dy: -0.5, t: 0}); 
    player.coins++;
    player.score += 100;
    
    // 100枚で1UP
    if (player.coins % 100 === 0) {
        player.lives++;
        playSound('powerup', x, y);
        updateHUD();
    }
    
    updateHUD();
}

/* ======= カメラとシェイク効果 ======= */
let camX = 0, camShake = 0;
function clamp(v, a, b) { return v < a ? a : v > b ? b : v }

function shakeCamera(intensity = 5) {
    camShake = intensity;
}

/* ======= HUD更新 ======= */
function updateHUD() {
    document.getElementById('coin').textContent = player.coins;
    document.getElementById('time').textContent = Math.max(0, timeLeft | 0);
    document.getElementById('lives').textContent = player.lives;
    document.getElementById('score').textContent = player.score;
    document.getElementById('stage').textContent = `${currentWorld}-${currentStage}`;
    document.getElementById('bombs').textContent = player.bombs;
}

/* ======= 描画 ======= */
const cv = document.getElementById('cv');
const g = cv.getContext('2d');

function drawBackground() {
    // グラデーション空
    const gradient = g.createLinearGradient(0, 0, 0, CAM_H);
    gradient.addColorStop(0, '#87CEEB');
    gradient.addColorStop(0.7, '#98FB98');
    gradient.addColorStop(1, '#90EE90');
    g.fillStyle = gradient;
    g.fillRect(0, 0, CAM_W, CAM_H);
    
    // 雲を描画
    g.fillStyle = 'rgba(255, 255, 255, 0.8)';
    for (let i = 0; i < 5; i++) {
        const x = (i * 200 - camX * 0.3) % (CAM_W + 100);
        drawCloud(x, 30 + i * 20);
    }
}

function drawCloud(x, y) {
    g.beginPath();
    g.arc(x, y, 20, 0, Math.PI * 2);
    g.arc(x + 25, y, 25, 0, Math.PI * 2);
    g.arc(x + 50, y, 20, 0, Math.PI * 2);
    g.arc(x + 20, y - 15, 15, 0, Math.PI * 2);
    g.arc(x + 35, y - 15, 15, 0, Math.PI * 2);
    g.fill();
}

function drawTerrain() {
    for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
            const t = at(x, y); 
            if (!t) continue;
            const sx = x * TZ - camX, sy = y * TZ;
            if (sx < -TZ || sx > CAM_W + TZ) continue;
            
            if (t == 1) { // 地面
                g.fillStyle = '#8B4513'; 
                g.fillRect(sx, sy, TZ, TZ);
                g.fillStyle = '#228B22';
                g.fillRect(sx, sy, TZ, 3);
                // 草のテクスチャ
                g.fillStyle = '#32CD32';
                for (let i = 0; i < 3; i++) {
                    g.fillRect(sx + i * 5 + 2, sy - 2, 1, 4);
                }
            }
            if (t == 2) { // ブロック
                g.fillStyle = '#DAA520'; 
                g.fillRect(sx, sy, TZ, TZ);
                g.fillStyle = '#B8860B';
                g.fillRect(sx + 2, sy + 2, TZ - 4, TZ - 4);
                g.fillStyle = '#FFD700';
                g.fillRect(sx + 4, sy + 4, TZ - 8, TZ - 8);
                g.fillStyle = '#8B4513';
                g.fillText('?', sx + 6, sy + 12);
            }
            if (t == 3) { // コイン
                const time = Date.now() * 0.01;
                g.save();
                g.translate(sx + 8, sy + 8);
                g.rotate(time * 0.1);
                g.fillStyle = '#FFD700'; 
                g.fillRect(-6, -6, 12, 12);
                g.fillStyle = '#FFA500';
                g.fillRect(-4, -4, 8, 8);
                g.fillStyle = '#FF8C00';
                g.fillRect(-2, -2, 4, 4);
                g.restore();
            }
            if (t == 5) { // 旗
                g.fillStyle = '#8B4513'; 
                g.fillRect(sx + 12, sy, 4, 112);
                g.fillStyle = '#FF0000'; 
                g.beginPath(); 
                g.moveTo(sx + 16, sy + 5); 
                g.lineTo(sx + 50, sy + 15); 
                g.lineTo(sx + 16, sy + 25); 
                g.fill();
                g.fillStyle = '#FFFFFF';
                g.fillRect(sx + 20, sy + 10, 2, 8);
            }
            if (t == 6) { // パワーアップ
                const time = Date.now() * 0.02;
                g.save();
                g.translate