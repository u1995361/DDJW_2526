addEventListener('load', function () {

    const menuMain   = document.getElementById('menu-main');
    const menuMode   = document.getElementById('menu-mode');
    const menuScores = document.getElementById('menu-scores');
    const menuSaves  = document.getElementById('menu-saves');

    let selectedMode = null;

    function show(section) {
        [menuMain, menuMode, menuScores, menuSaves].forEach(s => s.classList.add('hidden'));
        section.classList.remove('hidden');
    }

    // ── Menú principal ──
    document.getElementById('play').addEventListener('click', () => show(menuMode));

    document.getElementById('options').addEventListener('click', () =>
        window.location.assign('./html/options.html')
    );

    document.getElementById('saves').addEventListener('click', () => {
        renderSaves();
        show(menuSaves);
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
        const r1   = JSON.parse(localStorage.getItem('ranking_mode1') || '[]');
        const r2   = JSON.parse(localStorage.getItem('ranking_mode2') || '[]');
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
                const li  = document.createElement('li');
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

    // ── Partides guardades ──
    function renderSaves() {
        const saves = JSON.parse(localStorage.getItem('saves') || '[]');
        const list  = document.getElementById('saves-list');
        const empty = document.getElementById('saves-empty');
        list.innerHTML = '';

        if (saves.length === 0) {
            empty.classList.remove('hidden');
            return;
        }
        empty.classList.add('hidden');

        saves.forEach((s, i) => {
            const date = new Date(s.date).toLocaleDateString('ca-ES', {
                day: '2-digit', month: '2-digit', year: 'numeric',
                hour: '2-digit', minute: '2-digit'
            });
            const li = document.createElement('li');
            li.className = 'save-item';
            li.innerHTML = `
                <div class="save-info">
                    <span class="save-alias">${s.alias || 'Anònim'}</span>
                    <span class="save-meta">Mode ${s.mode} · Nivell ${s.level || 1} · ${s.score} pts</span>
                    <span class="save-date">${date}</span>
                </div>
                <div class="save-actions">
                    <button class="btn btn-small btn-load" data-idx="${i}">Carregar</button>
                    <button class="btn btn-small btn-delete" data-idx="${i}">Eliminar</button>
                </div>
            `;
            list.appendChild(li);
        });

        // Carregar partida
        list.querySelectorAll('.btn-load').forEach(btn => {
            btn.addEventListener('click', function () {
                const saves = JSON.parse(localStorage.getItem('saves') || '[]');
                const s     = saves[parseInt(this.dataset.idx)];
                if (!s) return;
                sessionStorage.setItem('load',  JSON.stringify(s));
                sessionStorage.setItem('mode',  s.mode);
                sessionStorage.setItem('alias', s.alias || 'Anònim');
                sessionStorage.setItem('saveId', s.saveId);
                window.location.assign('./html/canvasgame.html');
            });
        });

        // Eliminar partida
        list.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', function () {
                const saves = JSON.parse(localStorage.getItem('saves') || '[]');
                saves.splice(parseInt(this.dataset.idx), 1);
                localStorage.setItem('saves', JSON.stringify(saves));
                renderSaves();
            });
        });
    }

    document.getElementById('back-saves').addEventListener('click', () => show(menuMain));

});
