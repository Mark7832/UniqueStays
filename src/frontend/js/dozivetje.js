//obrazec je mišljen kot popup (pojavno okno)
//uporabnika preusmeri na prijavo, če ni prijavljen
const authToken = sessionStorage.getItem('token');
if (!authToken) window.location.href = 'login.html';

let vsaDozivetja = []; //globalni seznam vseh doživetij uporabnika
let idZaBrisanje = null; //ID doživetja, ki ga želi uporabnik izbrisati

//nalaganje doživetij
async function naloziDozivetja() {
    try {
        const res = await fetch('/api/dozivetja', {
            headers: { 'Authorization': 'Bearer ' + authToken }
        });
        vsaDozivetja = await res.json();
        prikaziDozivetja();
    } catch (err) {
        console.error('Napaka pri nalaganju doživetij:', err);
    }
}

//prikaz doživetij
function prikaziDozivetja() {
    const seznam = document.getElementById('seznamDozivetij');
    const prazno = document.getElementById('praznoStanje');
    const stats = document.getElementById('statsBar');

    if (vsaDozivetja.length === 0) {
        seznam.innerHTML = '';
        prazno.classList.remove('hidden');
        stats.classList.add('hidden');
        return;
    }

    prazno.classList.add('hidden');
    stats.classList.remove('hidden');
    seznam.innerHTML = '';

    //statistika (koliko doživetij ima uporabnik, koliko jih je vezanih na prenočišča, povprečna cena vseh doživetij skupaj)
    const vezana = vsaDozivetja.filter(d => d.TK_prenocisce).length;
    const povprecje = vsaDozivetja.reduce((s, d) => s + parseFloat(d.doplacilo), 0) / vsaDozivetja.length;
    document.getElementById('statSkupaj').textContent = vsaDozivetja.length;
    document.getElementById('statVezana').textContent = vezana;
    document.getElementById('statPovprecje').textContent = povprecje.toFixed(2) + ' €';

    vsaDozivetja.forEach((d, i) => {
        const div = document.createElement('div');
        div.className = 'card-in bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200';
        div.style.animationDelay = `${i * 0.05}s`;

        const vezavaZnacka = d.TK_prenocisce && d.naziv_prenocisca
            ? `<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                   🏠 ${d.naziv_prenocisca}
               </span>`
            : `<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-blue-400 text-xs font-bold">
                   Doživetje ni vezano na prenočišče!
               </span>`;

        div.innerHTML = `
            <div class="p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div class="flex-1 min-w-0">
                    <div class="flex flex-wrap items-center gap-2 mb-1.5">
                        <h3 class="text-lg font-extrabold text-slate-900">${d.naziv}</h3>
                        ${vezavaZnacka}
                    </div>
                    <p class="text-sm text-slate-500 leading-relaxed mb-3 line-clamp-2">${d.opis}</p>
                    <span class="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-amber-50 border border-amber-200">
                        <span class="text-amber-600 font-extrabold">€ ${parseFloat(d.doplacilo).toFixed(2)}</span>
                        <span class="text-amber-500 text-xs font-bold">doplačilo</span>
                    </span>
                </div>
                <div class="flex gap-2 shrink-0">
                    <button onclick="odpriObrazecUrejanje(${d.ID_dozivetje})"
                        class="px-4 py-2 rounded-full bg-purple-50 border-2 border-purple-200 text-purple-600 font-bold text-sm hover:border-blue-400 hover:text-blue-600 transition">
                        ✏️ Uredi
                    </button>
                    <button onclick="odpriObrazecBrisanje(${d.ID_dozivetje})"
                        class="px-4 py-2 rounded-full bg-red-50 border-2 border-red-200 text-red-500 font-bold text-sm hover:bg-red-50 transition">
                        🗑️ Briši
                    </button>
                </div>
            </div>
        `;
        seznam.appendChild(div);
    });
}

//dodajanje doživetja
function odpriObrazecDodajanje() {
    document.getElementById('obrazecNaslov').textContent = 'Novo doživetje';
    document.getElementById('obrazecId').value = '';
    document.getElementById('obrazecNaziv').value = '';
    document.getElementById('obrazecOpis').value = '';
    document.getElementById('obrazecDoplacilo').value = '';
    document.getElementById('obrazecNapaka').classList.add('hidden');
    document.getElementById('obrazec').classList.remove('hidden');
}

//urejanje doživetja
function odpriObrazecUrejanje(id) {
    const d = vsaDozivetja.find(x => x.ID_dozivetje === id);
    if (!d) return;
    document.getElementById('obrazecNaslov').textContent = 'Uredi doživetje';
    document.getElementById('obrazecId').value = d.ID_dozivetje;
    document.getElementById('obrazecNaziv').value = d.naziv;
    document.getElementById('obrazecOpis').value = d.opis;
    document.getElementById('obrazecDoplacilo').value = d.doplacilo;
    document.getElementById('obrazecNapaka').classList.add('hidden');
    document.getElementById('obrazec').classList.remove('hidden');
}

function zapriObrazec() {
    document.getElementById('obrazec').classList.add('hidden');
}

//shranjevanje doživetja
async function shraniDozivetje() {
    const napaka = document.getElementById('obrazecNapaka');
    const naziv = document.getElementById('obrazecNaziv').value.trim();
    const opis = document.getElementById('obrazecOpis').value.trim();
    const doplacilo = document.getElementById('obrazecDoplacilo').value;
    const id = document.getElementById('obrazecId').value;

    napaka.classList.add('hidden');

    if (!naziv || !opis || doplacilo === '') {
        napaka.textContent = 'Prosimo, izpolnite vsa obvezna polja.';
        napaka.classList.remove('hidden');
        return;
    }
    if (parseFloat(doplacilo) < 0) {
        napaka.textContent = 'Doplačilo ne sme biti negativno.';
        napaka.classList.remove('hidden');
        return;
    }

    const telo = { naziv, opis, doplacilo: parseFloat(doplacilo) };

    try {
        const res = await fetch(id ? `/api/dozivetje/${id}` : '/api/dozivetje', {
            method: id ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + authToken },
            body:JSON.stringify(telo)
        });
        const r = await res.json();

        if (res.ok) {
            zapriObrazec();
            prikaziSporocilo('✓ ' + (id ? 'Doživetje posodobljeno.' : 'Doživetje dodano.'), true);
            await naloziDozivetja();
        } else {
            napaka.textContent = r.napaka || 'Napaka pri shranjevanju.';
            napaka.classList.remove('hidden');
        }
    } catch {
        napaka.textContent = 'Napaka pri povezavi s strežnikom.';
        napaka.classList.remove('hidden');
    }
}

//brisanje doživetja
function odpriObrazecBrisanje(id) {
    idZaBrisanje = id;
    document.getElementById('obrazecBrisanje').classList.remove('hidden');
}
function zapriObrazecBrisanje() {
    idZaBrisanje = null;
    document.getElementById('obrazecBrisanje').classList.add('hidden');
}
async function potrdiIzbris() {
    if (!idZaBrisanje) return;
    try {
        const res = await fetch(`/api/dozivetje/${idZaBrisanje}`, {
            method:  'DELETE',
            headers: { 'Authorization': 'Bearer ' + authToken }
        });
        zapriObrazecBrisanje();
        if (res.ok) {
            prikaziSporocilo('✓ Doživetje je bilo izbrisano.', true);
            await naloziDozivetja();
        } else {
            const r = await res.json();
            prikaziSporocilo('✗ ' + (r.napaka || 'Napaka pri brisanju.'), false);
        }
    } catch {
        prikaziSporocilo('✗ Napaka pri brisanju.', false);
        zapriObrazecBrisanje();
    }
}

//sporočilo ob uspehu/napaki, traja 4s
function prikaziSporocilo(besedilo, uspeh) {
    const el = document.getElementById('sporocilo');
    el.textContent = besedilo;
    el.className = uspeh
        ? 'mb-6 px-6 py-4 rounded-2xl font-semibold text-sm bg-teal-50 border border-teal-200 text-teal-700'
        : 'mb-6 px-6 py-4 rounded-2xl font-semibold text-sm bg-red-50 border border-red-200 text-red-700';
    el.classList.remove('hidden');
    setTimeout(() => el.classList.add('hidden'), 4000);
}

//init
naloziDozivetja();