addEventListener('load', function () {

    const menuMain   = document.getElementById('menu-main');
    const menuMode   = document.getElementById('menu-mode');
    const menuScores = document.getElementById('menu-scores');

    let selectedMode = null;

    function show(section) {
        [menuMain, menuMode, menuScores].forEach(s => s.classList.add('hidden'));
        section.classList.remove('hidden');
    }

    // ── Menú principal ──
    document.getElementById('play').addEventListener('click', () => show(menuMode));

    document.getElementById('options').addEventListener('click', () =>
        window.location.assign('./html/options.html')
    );

    document.getElementById('saves').addEventListener('click', function () {
        const saves = JSON.parse(localStorage.getItem('saves') || '[]');
        if (saves.length === 0) { alert('No hi ha cap partida guardada.'); return; }

        const choice = saves.map((s, i) =>
            `${i + 1}. ${s.alias || 'Anònim'} — Mode ${s.mode} — Nivell ${s.level || 1} — ${new Date(s.date).toLocaleDateString()}`
        ).join('\n');
        const idx = parseInt(prompt('Tria una partida:\n' + choice)) - 1;
        if (isNaN(idx) || idx < 0 || idx >= saves.length) return;
        sessionStorage.setItem('load', JSON.stringify(saves[idx]));
        sessionStorage.setItem('mode',  saves[idx].mode);
        sessionStorage.setItem('alias', saves[idx].alias || 'Anònim');
        window.location.assign('./html/canvasgame.html');
    });

    // ── Selector de mode ──
    document.getElementById('mode1').addEventListener('click', function () {
        selectedMode = 1;
        document.querySelectorAll('.mode-card').forEach(c => c.classList.remove('selected'));
        this.classList.add('selected');
    });

    document.getElementById('mode2').addEventListener('click', function () {
        selectedMode = 2;
        document.querySelectorAll('.mode-card').forEach(c => c.classList.remove('selected'));
        this.classList.add('selected');
    });

    document.getElementById('start-game').addEventListener('click', function () {
        if (!selectedMode) { alert('Tria un mode de joc!'); return; }
        const alias = document.getElementById('alias').value.trim() || 'Anònim';
        sessionStorage.removeItem('load');
        sessionStorage.setItem('mode',  selectedMode);
        sessionStorage.setItem('alias', alias);
        window.location.assign('./html/canvasgame.html');
    });

    document.getElementById('back-mode').addEventListener('click', function () {
        show(menuMain);
        selectedMode = null;
        document.querySelectorAll('.mode-card').forEach(c => c.classList.remove('selected'));
    });

    // ── Puntuacions ──
    document.getElementById('scores').addEventListener('click', function () {
        const r1 = JSON.parse(localStorage.getItem('ranking_mode1') || '[]');
        const r2 = JSON.parse(localStorage.getItem('ranking_mode2') || '[]');
        const list = document.getElementById('scores-list');
        list.innerHTML = '';

        function renderSection(title, ranking) {
            const header = document.createElement('li');
            header.className = 'scores-header';
            header.textContent = title;
            list.appendChild(header);

            if (ranking.length === 0) {
                const empty = document.createElement('li');
                empty.className = 'no-scores';
                empty.textContent = 'Sense puntuacions encara.';
                list.appendChild(empty);
                return;
            }

            ranking.slice(0, 10).forEach((entry, i) => {
                const li = document.createElement('li');
                const lvl = entry.level ? ` · Niv.${entry.level}` : '';
                li.innerHTML = `<span class="score-pos">${i + 1}.</span><span class="score-alias">${entry.alias}</span><span class="score-pts">${entry.score} pts${lvl}</span>`;
                list.appendChild(li);
            });
        }

        renderSection('Mode 1', r1);
        renderSection('Mode 2', r2);
        show(menuScores);
    });

    document.getElementById('back-scores').addEventListener('click', () => show(menuMain));

});
