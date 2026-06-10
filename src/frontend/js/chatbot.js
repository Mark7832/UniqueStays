let chatSporocila = [];
let pozdravDan = false;
let dragging = false, dragOX = 0, dragOY = 0;
let resizing = false, rDir = '', rSX = 0, rSY = 0, rSW = 0, rSH = 0, rSL = 0, rST = 0;

const chatOkno = document.getElementById('chatOkno');
const chatHeader = document.getElementById('chatHeader');

function getWinPos() {
    return {
        left: parseInt(chatOkno.style.left) || (window.innerWidth - chatOkno.offsetWidth - 24),
        top: parseInt(chatOkno.style.top) || (window.innerHeight - chatOkno.offsetHeight - 88)
    };
}

function setWinPos(l, t) {
    const maxL = window.innerWidth - chatOkno.offsetWidth;
    const maxT = window.innerHeight - chatOkno.offsetHeight;
    chatOkno.style.left = Math.max(0, Math.min(l, maxL)) + 'px';
    chatOkno.style.top = Math.max(0, Math.min(t, maxT)) + 'px';
    chatOkno.style.right = 'auto';
    chatOkno.style.bottom = 'auto';
}

function toggleChat() {
    const odprt = chatOkno.classList.toggle('hidden');
    if (!odprt && !pozdravDan) {
        pozdravDan = true;
        dodajSporocilo('assistant', 'Pozdravljeni! 👋 Sem vaš UniqueStays pomočnik. Kako vam lahko pomagam pri iskanju idealnega prenočišča?');
    }
}

function dodajSporocilo(vloga, vsebina) {
    const container = document.getElementById('chatSporocila');
    const div = document.createElement('div');
    div.className = vloga === 'user' ? 'flex justify-end mb-3' : 'flex justify-start mb-3';
    div.innerHTML = `<div class="${vloga === 'user'
        ? 'bg-blue-600 text-white rounded-2xl rounded-tr-sm px-4 py-3 max-w-[80%] text-sm'
        : 'bg-slate-100 text-slate-800 rounded-2xl rounded-tl-sm px-4 py-3 max-w-[80%] text-sm'}">${vsebina}</div>`;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
    return div.firstElementChild;
}

async function posljiChatSporocilo() {
    const input = document.getElementById('chatInput');
    const besedilo = input.value.trim();
    if (!besedilo) return;
    input.value = '';
    dodajSporocilo('user', besedilo);
    chatSporocila.push({ role: 'user', content: besedilo });

    const container = document.getElementById('chatSporocila');
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'flex justify-start mb-3';
    loadingDiv.innerHTML = `<div class="bg-slate-100 text-slate-500 rounded-2xl rounded-tl-sm px-4 py-3 text-sm">✍️ Pišem odgovor...</div>`;
    container.appendChild(loadingDiv);
    container.scrollTop = container.scrollHeight;

    try {
        const res = await fetch('/api/chatbot', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sporocila: chatSporocila })
        });
        const data = await res.json();
        loadingDiv.remove();
        if (data.odgovor) {
            dodajSporocilo('assistant', data.odgovor);
            chatSporocila.push({ role: 'assistant', content: data.odgovor });
        }
    } catch (err) {
        loadingDiv.remove();
        dodajSporocilo('assistant', 'Oprostite, prišlo je do napake. Poskusite znova.');
    }
}

// eventi
document.getElementById('chatToggleBtn').addEventListener('click', toggleChat);
document.getElementById('chatCloseBtn').addEventListener('click', toggleChat);
document.getElementById('chatSendBtn').addEventListener('click', posljiChatSporocilo);
document.getElementById('chatInput').addEventListener('keydown', e => {
    if (e.key === 'Enter') posljiChatSporocilo();
});

// drag
chatHeader.addEventListener('mousedown', e => {
    if (e.target.closest('button')) return;
    dragging = true;
    const pos = getWinPos();
    dragOX = e.clientX - pos.left;
    dragOY = e.clientY - pos.top;
    chatHeader.style.cursor = 'grabbing';
    e.preventDefault();
});

// resize handles
chatOkno.querySelectorAll('[class*="rh-"]').forEach(h => {
    const dir = [...h.classList].find(c => c.startsWith('rh-'))?.replace('rh-', '');
    if (!dir) return;
    h.addEventListener('mousedown', e => {
        resizing = true; rDir = dir;
        rSX = e.clientX; rSY = e.clientY;
        rSW = chatOkno.offsetWidth; rSH = chatOkno.offsetHeight;
        const pos = getWinPos(); rSL = pos.left; rST = pos.top;
        e.preventDefault(); e.stopPropagation();
    });
});

document.addEventListener('mousemove', e => {
    if (dragging) {
        setWinPos(e.clientX - dragOX, e.clientY - dragOY);
        return;
    }
    if (!resizing) return;
    const dx = e.clientX - rSX, dy = e.clientY - rSY;
    const minW = 240, minH = 300, maxW = 560;
    let W = rSW, H = rSH, L = rSL, T = rST;
    if (rDir.includes('e')) W = Math.max(minW, Math.min(maxW, rSW + dx));
    if (rDir.includes('w')) { const nW = Math.max(minW, Math.min(maxW, rSW - dx)); L = rSL + (rSW - nW); W = nW; }
    if (rDir.includes('s')) H = Math.max(minH, rSH + dy);
    if (rDir.includes('n')) { const nH = Math.max(minH, rSH - dy); T = rST + (rSH - nH); H = nH; }
    chatOkno.style.width = W + 'px';
    chatOkno.style.height = H + 'px';
    setWinPos(L, T);
});

document.addEventListener('mouseup', () => {
    dragging = false; resizing = false;
    chatHeader.style.cursor = 'grab';
});