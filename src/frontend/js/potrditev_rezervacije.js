// Napolni stran s podatki iz URL parametrov
function naloziPodatke() {
    const params = new URLSearchParams(window.location.search);

    const naziv  = params.get('naziv')  || '–';
    const prihod = params.get('prihod') || '–';
    const odhod  = params.get('odhod')  || '–';
    const gostov = params.get('gostov') || '–';
    const noci   = params.get('noci')   || '–';
    const cena   = params.get('cena')   || '–';
    const prenId = params.get('prenocisceId');

    document.getElementById('potNaziv').textContent  = naziv;
    document.getElementById('potNoci').textContent   = noci;
    document.getElementById('potGostov').textContent = gostov;
    document.getElementById('potCena').textContent   = cena !== '–' ? `${cena} €` : '–';

    // Formatiraj datume v slovenščino
    function formatirajDatum(str) {
        if (!str || str === '–') return '–';
        const d = new Date(str);
        return d.toLocaleDateString('sl-SI', { day: 'numeric', month: 'long', year: 'numeric' });
    }
    document.getElementById('potPrihod').textContent = formatirajDatum(prihod);
    document.getElementById('potOdhod').textContent  = formatirajDatum(odhod);

    // Gumb za nazaj na prenočišče
    if (prenId) {
        document.getElementById('btnNazajNaPrenoc').href = `podrobnosti.html?id=${prenId}`;
    }

    // Confetti animacija 🎉
    sprozConfetti();
}

function sprozConfetti() {
    const barve = ['#2563eb', '#14b8a6', '#f59e0b', '#ef4444', '#8b5cf6', '#10b981'];
    for (let i = 0; i < 40; i++) {
        setTimeout(() => {
            const dot = document.createElement('div');
            dot.className = 'confetti-dot';
            const vel = 3 + Math.random() * 5;
            dot.style.cssText = `
                left: ${Math.random() * 100}vw;
                top: -10px;
                width: ${6 + Math.random() * 8}px;
                height: ${6 + Math.random() * 8}px;
                background: ${barve[Math.floor(Math.random() * barve.length)]};
                animation-duration: ${vel}s;
                opacity: 0.85;
            `;
            document.body.appendChild(dot);
            setTimeout(() => dot.remove(), vel * 1000 + 100);
        }, i * 60);
    }
}

document.addEventListener('DOMContentLoaded', naloziPodatke);
