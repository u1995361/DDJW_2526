import { $ } from "../library/jquery-4.0.0.slim.module.min.js";
import {
    clickCard, selectCards, startGame, initCard, saveGame,
    getScore, getLevel, getLives, getMaxLives,
    getGroupSize, getGroups, getGameItems, onLevelUp, onLivesLost
} from "./memory.js";

const C_W      = 96;
const C_H      = 128;
const GAP      = 12;
const PAD      = 20;
const MAX_COLS = 6;
const BACK     = '../resources/back.svg';

// Cache d'imatges: path -> { img, ready }
const imgCache = {};

function getImg(src) {
    if (!imgCache[src]) {
        const img   = new Image();
        const entry = { img, ready: false };
        img.onload  = () => { entry.ready = true; };
        img.onerror = () => { entry.ready = true; }; // no bloquejar si falla
        img.src     = src;
        imgCache[src] = entry;
    }
    return imgCache[src];
}

let cards      = [];
let idxSel     = -1;
let banner     = null;
let gameStarted = false;

const e_click = { click: false, x: 0, y: 0 };
let key = null;

const hudAlias  = document.getElementById('hud-alias');
const hudMode   = document.getElementById('hud-mode');
const hudLevel  = document.getElementById('hud-level');
const hudGroups = document.getElementById('hud-groups');
const hudScore  = document.getElementById('hud-score');
const hudLives  = document.getElementById('hud-lives');
const $game     = $('#game');
const canvas    = $game[0];
const ctx       = canvas.getContext('2d');

selectCards();
buildBoard();
bindEvents();
onLevelUp(rebuildBoard);
onLivesLost(() => banner = { text: `♥ ${getLives()}`, alpha: 1.0, color: '#e84118' });
requestAnimationFrame(loop);
waitAndStart();

// ─────────────────────────────────────────────

function buildBoard() {
    const items = getGameItems();
    const cols  = Math.min(items.length, MAX_COLS);
    const rows  = Math.ceil(items.length / cols);

    canvas.width  = PAD * 2 + cols * C_W + (cols - 1) * GAP;
    canvas.height = PAD * 2 + rows * C_H + (rows - 1) * GAP;

    hudAlias.textContent = sessionStorage.alias || 'Anònim';
    hudMode.textContent  = `Mode ${sessionStorage.mode || 1}`;

    getImg(BACK);
    items.forEach(src => getImg(src));

    cards = items.map((src, indx) => {
        const col  = indx % cols;
        const row  = Math.floor(indx / cols);
        const card = {
            frontSrc:   src,
            currentSrc: src,  // comença mostrant la frontal (startGame la girarà)
            x: PAD + col * (C_W + GAP),
            y: PAD + row * (C_H + GAP)
        };
        initCard(newSrc => { card.currentSrc = newSrc; });
        return card;
    });

    // Partida carregada: DONE mostra frontal, la resta mostra dorso
    if (sessionStorage.getItem('load')) {
        const saved = JSON.parse(sessionStorage.getItem('load'));
        cards.forEach((card, i) => {
            card.currentSrc = (saved.states && saved.states[i] === 2)
                ? card.frontSrc
                : BACK;
        });
    }

    idxSel = -1;
}

function waitAndStart() {
    const entries = Object.values(imgCache);
    let pending   = entries.filter(e => !e.ready).length;

    const tryStart = () => {
        if (!gameStarted) {
            gameStarted = true;
            startGame();
        }
    };

    if (pending === 0) { tryStart(); return; }

    entries.forEach(entry => {
        if (!entry.ready) {
            const orig = entry.img.onload;
            entry.img.onload = () => {
                orig && orig();
                pending--;
                if (pending === 0) tryStart();
            };
            const origErr = entry.img.onerror;
            entry.img.onerror = () => {
                origErr && origErr();
                pending--;
                if (pending === 0) tryStart();
            };
        }
    });
}

function rebuildBoard() {
    gameStarted = false;
    buildBoard();
    waitAndStart();
    banner = { text: `Nivell ${getLevel()}!`, alpha: 1.0, color: '#0097e6' };
}

function bindEvents() {
    $game.on('click', function (e) {
        const rect  = canvas.getBoundingClientRect();
        const scaleX = canvas.width  / rect.width;
        const scaleY = canvas.height / rect.height;
        e_click.click = true;
        e_click.x = (e.clientX - rect.left) * scaleX;
        e_click.y = (e.clientY - rect.top)  * scaleY;
    });
    $(document).keydown(e => { key = e.key; });
}

// ─────────────────────────────────────────────

function loop() {
    handleInput();
    draw();
    updateHUD();
    requestAnimationFrame(loop);
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    cards.forEach((card, indx) => {
        const entry = imgCache[card.currentSrc];

        // Placeholder mentre carrega
        if (!entry || !entry.ready) {
            ctx.fillStyle   = '#16213e';
            ctx.strokeStyle = '#ffffff22';
            ctx.lineWidth   = 2;
            ctx.beginPath();
            ctx.roundRect(card.x, card.y, C_W, C_H, 8);
            ctx.fill();
            ctx.stroke();
            return;
        }

        if (idxSel === indx) {
            ctx.save();
            ctx.shadowColor = '#0097e6';
            ctx.shadowBlur  = 14;
            ctx.drawImage(entry.img, card.x - 2, card.y - 2, C_W + 4, C_H + 4);
            ctx.restore();
        } else {
            ctx.drawImage(entry.img, card.x, card.y, C_W, C_H);
        }
    });

    if (banner) {
        ctx.save();
        ctx.globalAlpha = banner.alpha;
        ctx.font        = 'bold 48px Segoe UI';
        ctx.fillStyle   = banner.color || '#0097e6';
        ctx.textAlign   = 'center';
        ctx.shadowColor = '#000a';
        ctx.shadowBlur  = 12;
        ctx.fillText(banner.text, canvas.width / 2, canvas.height / 2);
        ctx.restore();
        banner.alpha -= 0.025;
        if (banner.alpha <= 0) banner = null;
    }
}

function handleInput() {
    if (e_click.click) {
        const { x, y } = e_click;
        cards.some((card, indx) => {
            if (x >= card.x && x <= card.x + C_W &&
                y >= card.y && y <= card.y + C_H) {
                clickCard(indx);
                return true;
            }
        });
        e_click.click = false;
    }

    if (key) {
        const cols = Math.min(cards.length, MAX_COLS);
        switch (key) {
            case 'Escape':     saveGame(); break;
            case 'ArrowRight': idxSel = idxSel < 0 ? 0 : (idxSel + 1) % cards.length; break;
            case 'ArrowLeft':  idxSel = idxSel < 0 ? cards.length - 1 : ((idxSel - 1) + cards.length) % cards.length; break;
            case 'ArrowDown':  idxSel = idxSel < 0 ? 0 : Math.min(idxSel + cols, cards.length - 1); break;
            case 'ArrowUp':    idxSel = idxSel < 0 ? 0 : Math.max(idxSel - cols, 0); break;
            case 'Enter':      if (idxSel >= 0) clickCard(idxSel); break;
        }
        key = null;
    }
}

function updateHUD() {
    const mode = parseInt(sessionStorage.mode) || 1;
    hudScore.textContent  = `Punts: ${getScore()}`;
    hudGroups.textContent = `Grups: ${getGroups()}`;

    if (mode === 2) {
        hudLevel.textContent = `Nivell ${getLevel()} · ×${getGroupSize()}`;
        hudLives.textContent = '♥'.repeat(getLives()) + '♡'.repeat(getMaxLives() - getLives());
    } else {
        hudLevel.textContent = `×${getGroupSize()}`;
        hudLives.textContent = '';
    }
}
