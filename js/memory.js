const resources = [
    '../resources/card_circle_red.svg',
    '../resources/card_square_red.svg',
    '../resources/card_triangle_red.svg',
    '../resources/card_circle_blue.svg',
    '../resources/card_square_blue.svg',
    '../resources/card_triangle_blue.svg'
];
const back = '../resources/back.svg';

const StateCard = Object.freeze({ DISABLE: 0, ENABLE: 1, DONE: 2 });

// ── Paràmetres de dificultat (Mode 1) ─────────────────────────────────────
const DIFFICULTY = {
    easy:   { penalty: 10, flipDelay: 1200 },
    normal: { penalty: 25, flipDelay: 1000 },
    hard:   { penalty: 50, flipDelay:  600 }
};

// ── Paràmetres per nivell (Mode 2) ────────────────────────────────────────
function levelParams(level) {
    const numPairs  = Math.min(2 + Math.floor((level - 1) / 2), 6);
    const penalty   = 25 + Math.floor((level - 1) / 2) * 5;
    const flipDelay = Math.max(1000 - (level - 1) * 50, 300);
    const groupSize = level < 5 ? 2 : level < 10 ? 3 : 4;
    return { numPairs, penalty, flipDelay, groupSize };
}

// ── Càlcul de score inicial (Mode 1) ──────────────────────────────────────
// Cada error possible costa `penalty`, deixem marge per ~60% d'errors
function initialScore(numPairs, groupSize, penalty) {
    const totalCards  = numPairs * groupSize;
    const maxAttempts = totalCards * 2;
    return maxAttempts * penalty;
}

// ─────────────────────────────────────────────────────────────────────────
var game = {
    items:     [],
    states:    [],
    setValue:  [],
    ready:     0,
    selected:  [],
    score:     0,
    groups:    0,
    groupSize: 2,
    locked:    false,
    level:     1,
    penalty:   25,
    flipDelay: 1000,
    levelUpCb: null,

    goBack: function (idx) {
        this.setValue[idx] && this.setValue[idx](back);
        this.states[idx] = StateCard.ENABLE;
    },
    goFront: function (idx) {
        this.setValue[idx] && this.setValue[idx](this.items[idx]);
        this.states[idx] = StateCard.DISABLE;
    },

    initLevel: function (level) {
        const p        = levelParams(level);
        this.level     = level;
        this.penalty   = p.penalty;
        this.flipDelay = p.flipDelay;
        this.groupSize = p.groupSize;
        this._buildItems(p.numPairs);
    },

    _buildItems: function (numPairs) {
        let unique = resources.slice();
        shuffle(unique);
        unique = unique.slice(0, numPairs);

        this.items = [];
        for (let i = 0; i < this.groupSize; i++) {
            this.items = this.items.concat(unique);
        }
        shuffle(this.items);

        this.groups   = numPairs;
        this.states   = new Array(this.items.length).fill(StateCard.ENABLE);
        this.selected = [];
        this.ready    = 0;
        this.locked   = false;
        this.setValue = [];
    },

    select: function () {
        const opts = localStorage.options ? JSON.parse(localStorage.options) : {};
        const mode = parseInt(sessionStorage.mode) || 1;

        if (sessionStorage.load) {
            const s        = JSON.parse(sessionStorage.load);
            this.items     = s.items;
            this.states    = s.states;
            this.selected  = s.selected  || [];
            this.score     = s.score;
            this.groups    = s.groups;
            this.groupSize = s.groupSize  || 2;
            this.level     = s.level      || 1;
            this.penalty   = s.penalty    || 25;
            this.flipDelay = s.flipDelay  || 1000;
            this.setValue  = [];

        } else if (mode === 2) {
            const startLevel = parseInt(opts.startLevel) || 1;
            this.score = 0;
            this.initLevel(startLevel);

        } else {
            // Mode 1: aplicar dificultat
            const diff     = DIFFICULTY[opts.difficulty] || DIFFICULTY.normal;
            this.groupSize = parseInt(opts.groupSize) || 2;
            const numPairs = parseInt(opts.pairs)     || 2;
            this.penalty   = diff.penalty;
            this.flipDelay = diff.flipDelay;
            this.level     = 1;
            this.score     = initialScore(numPairs, this.groupSize, diff.penalty);
            this._buildItems(numPairs);
        }
    },

    start: function () {
        this.items.forEach((_, indx) => {
            if (this.states[indx] !== StateCard.ENABLE) {
                this.ready++;
            } else {
                setTimeout(() => {
                    this.ready++;
                    this.goBack(indx);
                }, this.flipDelay + 100 * indx);
            }
        });
    },

    click: function (indx) {
        if (this.locked) return;
        if (this.states[indx] !== StateCard.ENABLE) return;
        if (this.ready < this.items.length) return;
        if (this.selected.includes(indx)) return;

        this.goFront(indx);
        this.selected.push(indx);

        if (this.selected.length < this.groupSize) return;

        const allMatch = this.selected.every(
            i => this.items[i] === this.items[this.selected[0]]
        );
        const mode = parseInt(sessionStorage.mode) || 1;

        if (allMatch) {
            this.selected.forEach(i => { this.states[i] = StateCard.DONE; });
            this.groups--;
            this.selected = [];

            if (this.groups <= 0) {
                if (mode === 2) {
                    this.score += this.level * 100 + Math.max(this.score, 0);
                    setTimeout(() => {
                        this.initLevel(this.level + 1);
                        this.levelUpCb && this.levelUpCb();
                    }, 500);
                } else {
                    setTimeout(() => this._endGame(true), 200);
                }
            }
        } else {
            this.score -= this.penalty;
            this.locked = true;
            const toFlip = this.selected.slice();
            this.selected = [];
            setTimeout(() => {
                toFlip.forEach(i => this.goBack(i));
                this.locked = false;
                if (mode === 1 && this.score <= 0) {
                    this._endGame(false);
                }
            }, 800);
        }
    },

    _endGame: function (won) {
        // Guardar al rànquing si ha guanyat
        if (won) {
            const ranking = JSON.parse(localStorage.getItem('ranking') || '[]');
            ranking.push({
                alias: sessionStorage.alias || 'Anònim',
                score: this.score,
                date:  Date.now()
            });
            localStorage.setItem('ranking', JSON.stringify(ranking));
        }
        sessionStorage.setItem('lastScore', this.score);
        sessionStorage.setItem('lastWon',   won ? '1' : '0');
        window.location.assign('../html/endgame.html');
    },

    save: function () {
        const toSave = {
            items:     this.items,
            states:    this.states,
            selected:  this.selected,
            score:     this.score,
            groups:    this.groups,
            groupSize: this.groupSize,
            level:     this.level,
            penalty:   this.penalty,
            flipDelay: this.flipDelay,
            mode:      parseInt(sessionStorage.mode) || 1,
            alias:     sessionStorage.alias || 'Anònim',
            date:      Date.now()
        };
        const saves = JSON.parse(localStorage.getItem('saves') || '[]');
        saves.push(toSave);
        localStorage.setItem('saves', JSON.stringify(saves));
        window.location.assign('../');
    }
};

function shuffle(arr) { arr.sort(() => Math.random() - 0.5); }

export function selectCards()           { game.select(); }
export function clickCard(indx)         { game.click(indx); }
export function startGame()             { game.start(); }
export function initCard(cb)            { game.setValue.push(cb); }
export function saveGame()              { game.save(); }
export function getScore()              { return game.score; }
export function getLevel()              { return game.level; }
export function getGroupSize()          { return game.groupSize; }
export function getGroups()             { return game.groups; }
export function getGameItems()          { return game.items; }
export function onLevelUp(cb)           { game.levelUpCb = cb; }
