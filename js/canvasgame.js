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

let resources = {};
let cards     = [];
let idxSel    = -1;
let banner    = null;

const e_click = { click: false, x: 0, y: 0 };
let key = null;

const hudAlias  = document.getElementById('hud-alias');
const hudMode   = document.getElementById('hud-mode');
const hudLevel  = document.getElementById('hud-level');
const hudGroups = document.getElementById('hud-groups');
const hudScore  = document.getElementById('hud-score');
const hudLives  = document.getElementById('hud-lives');
const $game     = $('#game');
const ctx       = $game[0].getContext('2d');

selectCards();
buildBoard();
bindEvents();
onLevelUp(rebuildBoard);
onLivesLost(() => banner = { text: `♥ ${getLives()}`, alpha: 1.0, color: '#e84118' });
startGame();
requestAnimationFrame(loop);

// ─────────────────────────────────────────────

function buildBoard() {
    const items = getGameItems();
    const cols  = Math.min(items.length, MAX_COLS);
    const rows  = Math.ceil(items.length / cols);

    $game.attr('width',  PAD * 2 + cols * C_W + (cols - 1) * GAP);
    $game.attr('height', PAD * 2 + rows * C_H + (rows - 1) * GAP);

    hudAlias.textContent = sessionStorage.alias || 'Anònim';
    hudMode.textContent  = `Mode ${sessionStorage.mode || 1}`;

    cards = items.map((src, indx) => {
        const col  = indx % cols;
        const row  = Math.floor(indx / cols);
        const card = {
            texture: '../resources/back.svg',  // comença mostrant el dorso
            x: PAD + col * (C_W + GAP),
            y: PAD + row * (C_H + GAP)
        };
        loadResource(src);                     // pre-carrega la imatge frontal
        initCard(val => { card.texture = val; });
        return card;
    });

    loadResource('../resources/back.svg');

    // Si és una partida carregada, mostrar les cartes ja encertades (DONE)
    if (sessionStorage.getItem('load')) {
        const { states, items } = JSON.parse(sessionStorage.getItem('load'));
        cards.forEach((card, i) => {
            if (states && states[i] === 2) {  // StateCard.DONE = 2
                card.texture = items[i];
            }
        });
    }

    idxSel = -1;
}

function rebuildBoard() {
    buildBoard();
    startGame();
    banner = { text: `Nivell ${getLevel()}!`, alpha: 1.0, color: '#0097e6' };
}

function bindEvents() {
    $game.on('click', function (e) {
        e_click.click = true;
        e_click.x = e.pageX - this.offsetLeft;
        e_click.y = e.pageY - this.offsetTop;
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
    ctx.clearRect(0, 0, $game[0].width, $game[0].height);

    cards.forEach((card, indx) => {
        const res = resources[card.texture];
        if (!res?.ready) return;

        if (idxSel === indx) {
            ctx.save();
            ctx.shadowColor = '#0097e6';
            ctx.shadowBlur  = 14;
            ctx.drawImage(res.img, card.x - 2, card.y - 2, C_W + 4, C_H + 4);
            ctx.restore();
        } else {
            ctx.drawImage(res.img, card.x, card.y, C_W, C_H);
        }
    });

    if (banner) {
        const w = parseInt($game.attr('width'));
        const h = parseInt($game.attr('height'));
        ctx.save();
        ctx.globalAlpha = banner.alpha;
        ctx.font        = 'bold 48px Segoe UI';
        ctx.fillStyle   = banner.color || '#0097e6';
        ctx.textAlign   = 'center';
        ctx.shadowColor = '#000a';
        ctx.shadowBlur  = 12;
        ctx.fillText(banner.text, w / 2, h / 2);
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

// ─────────────────────────────────────────────

function loadResource(src) {
    if (resources[src]) return;
    const img  = new Image();
    img.src    = src;
    const res  = { img, ready: false };
    img.onload = () => res.ready = true;
    resources[src] = res;
}
