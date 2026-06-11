const resources = [
    '../resources/cr.svg',
    '../resources/sr.svg',
    '../resources/tr.svg',
    '../resources/cb.svg',
    '../resources/sb.svg',
    '../resources/tb.svg'
];
const back = '../resources/back.svg';

const StateCard = Object.freeze({ DISABLE: 0, ENABLE: 1, DONE: 2 });

const DIFFICULTY = {
    easy:   { penalty: 10, flipDelay: 1200 },
    normal: { penalty: 25, flipDelay: 1000 },
    hard:   { penalty: 50, flipDelay:  600 }
};

function levelParams(level) {
    const numPairs  = Math.min(2 + Math.floor((level - 1) / 2), 6);
    const penalty   = 25 + Math.floor((level - 1) / 2) * 5;
    const flipDelay = Math.max(1000 - (level - 1) * 50, 300);
    const groupSize = level < 5 ? 2 : level < 10 ? 3 : 4;
    return { numPairs, penalty, flipDelay, groupSize };
}

function initialScore(numPairs, groupSize, penalty) {
    return numPairs * groupSize * 2 * penalty;
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

    // Mode 2
    lives:     3,
    maxLives:  3,

    levelUpCb:  null,
    livesLostCb: null,  // callback quan es perd una vida

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
            const s          = JSON.parse(sessionStorage.load);
            this.items       = s.items;
            this.states      = s.states;
            this.selected    = s.selected   || [];
            this.score       = s.score;
            this.groups      = s.groups;
            this.groupSize   = s.groupSize  || 2;
            this.level       = s.level      || 1;
            this.penalty     = s.penalty    || 25;
            this.flipDelay   = s.flipDelay  || 1000;
            this.lives       = s.lives      ?? 3;
            this.maxLives    = s.maxLives   || 3;
            this.setValue    = [];

        } else if (mode === 2) {
            const startLevel = parseInt(opts.startLevel) || 1;
            this.score    = 0;
            this.lives    = 3;
            this.maxLives = 3;
            this.initLevel(startLevel);
            // Respectar groupSize2 de les opcions si és major que el calculat per nivell
            const optsGroupSize2 = parseInt(opts.groupSize2) || 2;
            if (optsGroupSize2 > this.groupSize) {
                this.groupSize = optsGroupSize2;
                this._buildItems(levelParams(startLevel).numPairs);
            }

        } else {
            const diff       = DIFFICULTY[opts.difficulty] || DIFFICULTY.normal;
            this.groupSize   = parseInt(opts.groupSize) || 2;
            const numPairs   = parseInt(opts.pairs)     || 2;
            this.penalty     = diff.penalty;
            this.flipDelay   = diff.flipDelay;
            this.level       = 1;
            this.lives       = 0;  // Mode 1 no usa vides
            this.score       = initialScore(numPairs, this.groupSize, diff.penalty);
            this._buildItems(numPairs);
        }
    },

    start: function () {
        this.ready = 0;  // reset sempre abans de comptar
        this.items.forEach((_, indx) => {
            if (this.states[indx] !== StateCard.ENABLE) {
                // Carta ja encertada (DONE) o girada (DISABLE): compta directament
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
                    // Bonus: nivell × 100 + vides restants × 50
                    this.score += this.level * 100 + this.lives * 50;
                    setTimeout(() => {
                        this.initLevel(this.level + 1);
                        this.levelUpCb && this.levelUpCb();
                    }, 500);
                } else {
                    setTimeout(() => this._endGame(true), 200);
                }
            }
        } else {
            if (mode === 2) {
                // Mode 2: perdre una vida
                this.lives--;
                this.livesLostCb && this.livesLostCb();
            } else {
                // Mode 1: perdre punts
                this.score -= this.penalty;
            }

            this.locked = true;
            const toFlip = this.selected.slice();
            this.selected = [];
            setTimeout(() => {
                toFlip.forEach(i => this.goBack(i));
                this.locked = false;
                // Comprovar fi de partida després de girar les cartes
                if (mode === 2 && this.lives <= 0) {
                    this._endGame(false);
                } else if (mode === 1 && this.score <= 0) {
                    this._endGame(false);
                }
            }, 800);
        }
    },

    _endGame: function (won) {
        const mode = parseInt(sessionStorage.mode) || 1;

        if (won || mode === 2) {
            // Mode 1 guarda si guanya, Mode 2 guarda sempre (és la puntuació final)
            const key     = `ranking_mode${mode}`;
            const ranking = JSON.parse(localStorage.getItem(key) || '[]');
            ranking.push({
                alias: sessionStorage.alias || 'Anònim',
                score: this.score,
                level: this.level,
                date:  Date.now()
            });
            // Mantenir només el top 10
            ranking.sort((a, b) => b.score - a.score);
            ranking.splice(10);
            localStorage.setItem(key, JSON.stringify(ranking));
        }

        sessionStorage.setItem('lastScore', this.score);
        sessionStorage.setItem('lastWon',   won ? '1' : '0');
        sessionStorage.setItem('lastLevel', this.level);
        window.location.assign('../html/endgame.html');
    },

    save: function () {
        const existingSaveId = sessionStorage.getItem('saveId') || null;
        const saveId = existingSaveId || `save_${Date.now()}`;

        const toSave = {
            saveId,
            items:     this.items,
            states:    this.states,
            selected:  this.selected,
            score:     this.score,
            groups:    this.groups,
            groupSize: this.groupSize,
            level:     this.level,
            penalty:   this.penalty,
            flipDelay: this.flipDelay,
            lives:     this.lives,
            maxLives:  this.maxLives,
            mode:      parseInt(sessionStorage.mode) || 1,
            alias:     sessionStorage.alias || 'Anònim',
            date:      Date.now()
        };

        const saves = JSON.parse(localStorage.getItem('saves') || '[]');
        const idx   = saves.findIndex(s => s.saveId === saveId);

        if (idx >= 0) {
            saves[idx] = toSave;
        } else {
            saves.push(toSave);
        }

        localStorage.setItem('saves', JSON.stringify(saves));
        sessionStorage.setItem('saveId', saveId);
        window.location.assign('../');
    }
};

function shuffle(arr) { arr.sort(() => Math.random() - 0.5); }

export function selectCards()          { game.select(); }
export function clickCard(indx)        { game.click(indx); }
export function startGame()            { game.start(); }
export function initCard(cb)           { game.setValue.push(cb); }
export function saveGame()             { game.save(); }
export function getScore()             { return game.score; }
export function getLevel()             { return game.level; }
export function getLives()             { return game.lives; }
export function getMaxLives()          { return game.maxLives; }
export function getGroupSize()         { return game.groupSize; }
export function getGroups()            { return game.groups; }
export function getGameItems()         { return game.items; }
export function onLevelUp(cb)          { game.levelUpCb = cb; }
export function onLivesLost(cb)        { game.livesLostCb = cb; }
