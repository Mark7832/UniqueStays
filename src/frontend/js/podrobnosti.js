// Globalne spremenljivke
let map;
let destinationMarker;
let userMarker;
let routingControl;
let destinationCoords = null;

const API_URL = 'http://localhost:3000/api';

// Funkcija za inicializacijo zemljevida
function inicializirajZemljevid(koordinate) {
    const coords = koordinate.split(',').map(c => parseFloat(c.trim()));
    
    if (coords.length !== 2 || isNaN(coords[0]) || isNaN(coords[1])) {
        console.error('❌ Neveljavne koordinate:', koordinate);
        return;
    }
    
    destinationCoords = coords;
    const lat = coords[0];
    const lng = coords[1];
    
    map = L.map('map').setView([lat, lng], 13);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
    }).addTo(map);
    
    const customIcon = L.divIcon({
        className: 'custom-marker',
        html: '<div style="background: #2563eb; width: 40px; height: 40px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 4px solid white; box-shadow: 0 4px 6px rgba(0,0,0,0.3);"><div style="transform: rotate(45deg); color: white; font-size: 20px; text-align: center; line-height: 32px;">🏰</div></div>',
        iconSize: [40, 40],
        iconAnchor: [20, 40],
        popupAnchor: [0, -40]
    });
    
    destinationMarker = L.marker([lat, lng], { icon: customIcon }).addTo(map);
    
    const naziv = document.getElementById('nazivPrenocisca').textContent;
    const naslov = document.getElementById('naslovLokacija').textContent;
    
    destinationMarker.bindPopup(`
        <div style="text-align: center; min-width: 200px;">
            <h3 style="font-weight: bold; font-size: 16px; margin-bottom: 8px; color: #1e293b;">${naziv}</h3>
            <p style="color: #64748b; margin-bottom: 12px;">${naslov}</p>
            <button onclick="prikaziMojoLokacijo()" style="background: #2563eb; color: white; padding: 8px 16px; border-radius: 8px; border: none; cursor: pointer; font-weight: bold;">
                📍 Načrtuj pot
            </button>
        </div>
    `).openPopup();
}

// Funkcija za prikaz uporabnikove lokacije in routinga
function prikaziMojoLokacijo() {
    if (!map || !destinationCoords) {
        alert('❌ Zemljevid še ni inicializiran!');
        return;
    }
    
    if (!navigator.geolocation) {
        alert('❌ Vaša naprava ne podpira geolokacije!');
        return;
    }
    
    navigator.geolocation.getCurrentPosition(
        function(position) {
            const userLat = position.coords.latitude;
            const userLng = position.coords.longitude;
            
            if (userMarker) {
                map.removeLayer(userMarker);
            }
            if (routingControl) {
                map.removeControl(routingControl);
            }
            
            const userIcon = L.divIcon({
                className: 'user-marker',
                html: '<div style="background: #10b981; width: 30px; height: 30px; border-radius: 50%; border: 4px solid white; box-shadow: 0 4px 6px rgba(0,0,0,0.3);"><div style="color: white; font-size: 16px; text-align: center; line-height: 22px;">📍</div></div>',
                iconSize: [30, 30],
                iconAnchor: [15, 15]
            });
            
            userMarker = L.marker([userLat, userLng], { icon: userIcon }).addTo(map);
            userMarker.bindPopup('<strong>Vaša lokacija</strong>').openPopup();
            
            routingControl = L.Routing.control({
                waypoints: [
                    L.latLng(userLat, userLng),
                    L.latLng(destinationCoords[0], destinationCoords[1])
                ],
                routeWhileDragging: false,
                showAlternatives: true,
                lineOptions: {
                    styles: [
                        {color: '#2563eb', opacity: 0.8, weight: 6}
                    ]
                },
                createMarker: function() { return null; },
                language: 'sl'
            }).addTo(map);
            
            const bounds = L.latLngBounds([
                [userLat, userLng],
                [destinationCoords[0], destinationCoords[1]]
            ]);
            map.fitBounds(bounds, { padding: [50, 50] });
        },
        function(error) {
            console.error('❌ Napaka pri pridobivanju lokacije:', error);
            alert('❌ Ne morem pridobiti vaše lokacije. Prosimo omogočite dostop do lokacije v nastavitvah brskalnika.');
        },
        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        }
    );
}

// Funkcija za scroll do zemljevida
function scrollToMap() {
    document.getElementById('mapSection').scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
    });
}

// Nalaganje podatkov iz API
async function naloziPodatke() {
    const urlParams = new URLSearchParams(window.location.search);
    const prenocisceId = urlParams.get('id') || 2;
    
    try {
        const response = await fetch(`${API_URL}/prenocisce/${prenocisceId}`);
        
        if (!response.ok) {
            throw new Error(`HTTP napaka! Status: ${response.status}`);
        }
        
        const data = await response.json();
        prikaziPodatke(data);
        
        if (data.prenocisce && data.prenocisce.koordinate) {
            setTimeout(() => {
                inicializirajZemljevid(data.prenocisce.koordinate);
            }, 100);
        }
        
    } catch (error) {
        console.error('❌ Napaka:', error);
        prikaziNapako(error);
    }
}

// Prikaz podatkov na strani
function prikaziPodatke(data) {
    const { prenocisce, slike, dozivetja, komentarji, povprecnaOcena } = data;
    
    if (!prenocisce) {
        console.error('NAPAKA: Prenočišče ne obstaja v podatkih!');
        return;
    }
    
    if (slike && slike.length > 0) {
        prikaziHeroSliko(slike);
    }
    
    // Osnovni podatki
    setElementText('tipPrenocisca', `🏰 ${prenocisce.tip_prenocisca || 'Neznano'} • Slovenija`);
    setElementText('nazivPrenocisca', prenocisce.naziv || 'Neznano prenočišče');
    setElementText('opisPrenocisca', prenocisce.opis_prenocisca || 'Opis ni na voljo');
    setElementText('opisPodrobno', prenocisce.opis_prenocisca || 'Opis ni na voljo');
    
    // Statistike
    setElementText('cenaNaNoc', prenocisce.cena_na_noc ? `${prenocisce.cena_na_noc} €` : 'N/A');
    setElementText('maxGostov', prenocisce.max_gostov || 'N/A');
    setElementText('steviloSob', prenocisce.stevilo_sob || 'N/A');
    setElementText('povprecnaOcena', povprecnaOcena || '0');
    
    // Cards
    setElementText('tipCard', prenocisce.tip_prenocisca || 'Neznano');
    setElementText('maxGostovCard', prenocisce.max_gostov || 'N/A');
    setElementText('steviloSobCard', prenocisce.stevilo_sob || 'N/A');
    setElementText('povprecnaOcenaCard', povprecnaOcena || '0');
    
    // Lokacija
    setElementText('naslovLokacija', prenocisce.naslov || 'Neznana lokacija');
    setElementText('koordinateLokacija', prenocisce.koordinate || 'N/A');
    
    // Sezona
    setElementText('sezonaInfo', prenocisce.sezona || 'Celo leto');
    
    // WiFi, Parking, Razgled
    if (prenocisce.wifi) {
        document.getElementById('wifiCard').style.display = 'block';
    }
    if (prenocisce.parking) {
        document.getElementById('parkingCard').style.display = 'block';
    }
    if (prenocisce.razgled) {
        document.getElementById('razgledCard').style.display = 'block';
    }
    
    // Tagi
    prikaziTage(prenocisce.tagi);
    
    // Doživetja
    prikaziDozivetja(dozivetja || []);
    
    // Komentarji
    prikaziKomentarje(komentarji || []);

    // Shrani podatke za rezervacijski modal
    _rezervacijaData.naziv     = prenocisce.naziv || '';
    _rezervacijaData.cenaNaNoc = parseFloat(prenocisce.cena_na_noc) || 0;
    _rezervacijaData.maxGostov = parseInt(prenocisce.max_gostov) || 10;
}

// Prikaz hero background slike
function prikaziHeroSliko(slike) {
    const coverSlika = slike.find(s => s.cover === true || s.cover === 1);
    
    if (!coverSlika) {
        console.warn('⚠️ Ni cover slike');
        return;
    }
    
    const heroBackground = document.getElementById('heroBackground');
    if (!heroBackground) {
        console.error('❌ heroBackground element ne obstaja!');
        return;
    }
    
    let imageUrl = '';
    
    if (coverSlika.slika && typeof coverSlika.slika === 'string') {
        if (coverSlika.slika.startsWith('data:')) {
            imageUrl = coverSlika.slika;
        } else {
            const ext = coverSlika.ime_slike.split('.').pop().toLowerCase();
            const mimeType = ext === 'png' ? 'image/png' : 'image/jpeg';
            imageUrl = `data:${mimeType};base64,${coverSlika.slika}`;
        }
    } else if (coverSlika.ID_slika) {
        imageUrl = `${API_URL}/slika/${coverSlika.ID_slika}`;
    } else {
        console.error('❌ Slika nima ne base64 ne ID_slika!');
        return;
    }
    
    heroBackground.style.backgroundImage = `url('${imageUrl}')`;
    heroBackground.style.display = 'block';
}

// Helper funkcija za nastavljanje teksta elementov
function setElementText(id, text) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = text;
    } else {
        console.warn(`⚠️ Element z ID "${id}" ne obstaja!`);
    }
}

// Prikaz tagov
function prikaziTage(tagiString) {
    const container = document.getElementById('tagiContainer');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (!tagiString) {
        container.innerHTML = '<p class="text-slate-400">Ni podatkov o posebnostih</p>';
        return;
    }
    
    try {
        const tagi = typeof tagiString === 'string' ? JSON.parse(tagiString) : tagiString;
        
        if (!Array.isArray(tagi) || tagi.length === 0) {
            container.innerHTML = '<p class="text-slate-400">Ni podatkov o posebnostih</p>';
            return;
        }
        
        tagi.forEach(tag => {
            const tagElement = document.createElement('div');
            tagElement.className = 'inline-flex items-center gap-2 px-5 py-3 rounded-full bg-gradient-to-r from-blue-50 to-teal-50 border-2 border-blue-200 hover:border-blue-400 transition-all hover:scale-105';
            
            tagElement.innerHTML = `
                <span class="text-2xl">${tag.emoji || '✨'}</span>
                <span class="font-semibold text-slate-800">${tag.naziv || 'Posebnost'}</span>
            `;
            
            container.appendChild(tagElement);
        });
        
    } catch (error) {
        console.error('❌ Napaka pri parsanju tagov:', error);
        container.innerHTML = '<p class="text-slate-400">Napaka pri nalaganju posebnosti</p>';
    }
}

// Prikaz doživetij
function prikaziDozivetja(dozivetja) {
    const container = document.getElementById('dozivetjaContainer');
    if (!container) return;
    
    container.innerHTML = '';

    if (!dozivetja || dozivetja.length === 0) {
        document.getElementById('dozivetjaSection').style.display = 'none';
        return;
    }
    
    document.getElementById('dozivetjaSection').style.display = 'block';

    dozivetja.forEach(dozivetje => {
        const card = document.createElement('div');
        card.className = 'group relative overflow-hidden rounded-3xl bg-white border-2 border-slate-200 p-8 transition-all hover:border-blue-500 hover:shadow-2xl hover:-translate-y-2';
        
        card.innerHTML = `
            <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-100 to-teal-100 flex items-center justify-center text-3xl mb-6">
                🎭
            </div>

            <h3 class="text-2xl font-bold text-slate-900 mb-3">
                ${dozivetje.naziv || 'Neznano doživetje'}
            </h3>

            <p class="text-slate-600 mb-6 leading-relaxed">
                ${dozivetje.opis || 'Ni opisa'}
            </p>

            <div class="flex items-center justify-between">
                <div class="text-3xl font-extrabold text-blue-600">
                    ${dozivetje.doplacilo || '0'} €
                </div>

                <button class="px-6 py-3 rounded-full bg-slate-900 text-white font-bold hover:bg-blue-600 transition-all">
                    Dodaj
                </button>
            </div>
        `;
        
        container.appendChild(card);
    });
}

// Prikaz komentarjev
function prikaziKomentarje(komentarji) {
    const container = document.getElementById('komentarjiContainer');
    if (!container) return;
    
    container.innerHTML = '';

    if (komentarji.length === 0) {
        container.innerHTML = '<p class="text-slate-600 col-span-full text-center">Trenutno ni komentarjev.</p>';
        return;
    }

    komentarji.forEach(komentar => {
        const card = document.createElement('div');
        card.className = 'p-8 rounded-3xl bg-slate-50 border border-slate-200';
        
        const datum = new Date(komentar.datum_komentar);
        const formatiraniDatum = datum.toLocaleDateString('sl-SI', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });

        const inicialiIme = (komentar.ime_uporabnika || 'U').charAt(0);
        const inicialiPriimek = (komentar.priimek_uporabnika || 'N').charAt(0);

        card.innerHTML = `
            <div class="flex items-center gap-4 mb-6">
                <div class="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center text-white font-bold text-xl">
                    ${inicialiIme}${inicialiPriimek}
                </div>

                <div>
                    <div class="font-bold text-slate-900">
                        ${komentar.ime_uporabnika || 'Neznano'} ${komentar.priimek_uporabnika || ''}
                    </div>
                    <div class="text-sm text-slate-500">
                        ${komentar.drzava || 'Neznano'} • ${formatiraniDatum}
                    </div>
                </div>
            </div>

            <div class="flex items-center gap-2 mb-4">
                ${'⭐'.repeat(komentar.ocena_splosna || 0)}
                <span class="text-slate-600 font-semibold">${komentar.ocena_splosna || 0}/5</span>
            </div>

            ${komentar.komentar ? `
                <p class="text-slate-700 leading-relaxed mb-4">
                    "${komentar.komentar}"
                </p>
            ` : ''}

            <div class="grid grid-cols-2 gap-3 text-sm">
                <div class="px-3 py-2 rounded-lg bg-white">
                    <div class="text-slate-500">Udobje</div>
                    <div class="font-bold">${komentar.ocena_udobje || 0}/5</div>
                </div>
                <div class="px-3 py-2 rounded-lg bg-white">
                    <div class="text-slate-500">Unikatnost</div>
                    <div class="font-bold">${komentar.ocena_unikatnost || 0}/5</div>
                </div>
                <div class="px-3 py-2 rounded-lg bg-white">
                    <div class="text-slate-500">Lokacija</div>
                    <div class="font-bold">${komentar.ocena_lokacija || 0}/5</div>
                </div>
                <div class="px-3 py-2 rounded-lg bg-white">
                    <div class="text-slate-500">Doživetje</div>
                    <div class="font-bold">${komentar.ocena_dozivetje || 0}/5</div>
                </div>
            </div>
        `;
        
        container.appendChild(card);
    });
}

// Prikaz napake
function prikaziNapako(error) {
    document.getElementById('nazivPrenocisca').textContent = 'Napaka pri nalaganju';
    document.getElementById('opisPrenocisca').textContent = `Napaka: ${error.message}. Preveri da server teče!`;
}

// Zaženi nalaganje ob nalaganju strani
window.addEventListener('DOMContentLoaded', naloziPodatke);

// ===================== REZERVACIJSKI MODAL =====================

// Shranjeni podatki prenočišča (za ceno in max gostov)
let _rezervacijaData = {
    naziv: '',
    cenaNaNoc: 0,
    maxGostov: 10
};

// Zasedena obdobja (naložena ob odprtju modala)
let _zasedenObdobja = [];

function jeZaseden(datumStr) {
    const d = new Date(datumStr);
    return _zasedenObdobja.some(({ od, do_ }) => d >= od && d < do_);
}

function prvProstDatum(odStr) {
    let d = new Date(odStr);
    for (let i = 0; i < 365; i++) {
        const str = d.toISOString().split('T')[0];
        if (!jeZaseden(str)) return str;
        d.setDate(d.getDate() + 1);
    }
    return odStr;
}

async function naloziZasedenost(prenocisceId) {
    try {
        const res = await fetch(`${API_URL}/rezervacija/${prenocisceId}/zasedeni`);
        const data = await res.json();
        _zasedenObdobja = [
            ...(data.rezervacije || []),
            ...(data.termini || [])
        ].map(r => ({
            od:  new Date(r.datum_od),
            do_: new Date(r.datum_do)
        }));
    } catch (e) {
        _zasedenObdobja = [];
    }
}

async function odpriRezervacijo() {
    const modal = document.getElementById('rezervacijaModal');
    const panel = document.getElementById('rezervacijaPanel');
    if (!modal || !panel) return;

    // Nastavi naziv
    const nazEl = document.getElementById('modalNaziv');
    if (nazEl) nazEl.textContent = _rezervacijaData.naziv || document.getElementById('nazivPrenocisca')?.textContent || '';

    // Nastavi max gostov info
    const mgEl = document.getElementById('maxGostovInfo');
    if (mgEl) mgEl.textContent = `(max ${_rezervacijaData.maxGostov})`;

    // Skrij napake/uspeh
    document.getElementById('modalNapaka')?.classList.add('hidden');
    document.getElementById('modalUspeh')?.classList.add('hidden');

    // Prikaži modal takoj (med nalaganjem)
    modal.style.display = 'flex';
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            panel.classList.remove('scale-95');
            panel.classList.add('scale-100');
        });
    });
    document.body.style.overflow = 'hidden';

    // Naloži zasedene datume
    const urlParams = new URLSearchParams(window.location.search);
    const prenocisceId = urlParams.get('id') || 2;
    await naloziZasedenost(prenocisceId);

    // Nastavi datume (preskoči zasedene)
    const danes = new Date().toISOString().split('T')[0];
    const prihodStr = prvProstDatum(danes);

    const naslednji = new Date(prihodStr);
    naslednji.setDate(naslednji.getDate() + 1);
    const odhodStr = prvProstDatum(naslednji.toISOString().split('T')[0]);

    const prihod = document.getElementById('datumPrihod');
    const odhod  = document.getElementById('datumOdhod');
    if (prihod) { prihod.min = danes; prihod.value = prihodStr; }
    if (odhod)  { odhod.min  = danes; odhod.value  = odhodStr; }

    // Opozori ob izbiri zasedenega datuma
    prihod?.addEventListener('change', onPrihodChange);
    odhod?.addEventListener('change', onOdhodChange);

    posodobiCeno();
}

function onPrihodChange() {
    const el = document.getElementById('datumPrihod');
    const napaka = document.getElementById('modalNapaka');
    if (jeZaseden(el.value)) {
        napaka.textContent = '⚠️ Izbrani datum prihoda je zaseden. Izberite drug datum.';
        napaka.classList.remove('hidden');
        el.value = prvProstDatum(el.value);
    } else {
        napaka.classList.add('hidden');
    }
    posodobiCeno();
}

function onOdhodChange() {
    const el = document.getElementById('datumOdhod');
    const napaka = document.getElementById('modalNapaka');
    const prihodVal = document.getElementById('datumPrihod')?.value;

    // Preveri ali katerikoli datum v obdobju pade v zasedeno
    if (prihodVal && el.value) {
        const od = new Date(prihodVal);
        const do_ = new Date(el.value);
        let zaseden = false;
        let d = new Date(od);
        while (d < do_) {
            if (jeZaseden(d.toISOString().split('T')[0])) { zaseden = true; break; }
            d.setDate(d.getDate() + 1);
        }
        if (zaseden) {
            napaka.textContent = '⚠️ Izbrano obdobje vsebuje zasedene datume. Izberite drug datum odhoda.';
            napaka.classList.remove('hidden');
            el.value = '';
            return;
        }
    }
    napaka.classList.add('hidden');
    posodobiCeno();
}

function zapriRezervacijo() {
    const modal = document.getElementById('rezervacijaModal');
    const panel = document.getElementById('rezervacijaPanel');
    if (!modal || !panel) return;

    panel.classList.remove('scale-100');
    panel.classList.add('scale-95');

    setTimeout(() => { modal.style.display = 'none'; }, 200);
    document.body.style.overflow = '';

    // Odstrani event listenerje
    document.getElementById('datumPrihod')?.removeEventListener('change', onPrihodChange);
    document.getElementById('datumOdhod')?.removeEventListener('change', onOdhodChange);
}

function spremembaGostov(delta) {
    const el = document.getElementById('steviloGostov');
    if (!el) return;
    let val = parseInt(el.textContent) + delta;
    val = Math.max(1, Math.min(val, _rezervacijaData.maxGostov || 10));
    el.textContent = val;

    // Animacija
    el.classList.add('scale-125', 'text-blue-600');
    setTimeout(() => el.classList.remove('scale-125', 'text-blue-600'), 200);
}

function posodobiCeno() {
    const prihodVal = document.getElementById('datumPrihod')?.value;
    const odhodVal  = document.getElementById('datumOdhod')?.value;
    const summary   = document.getElementById('cenaSummary');

    if (!prihodVal || !odhodVal) { if (summary) summary.style.display = 'none'; return; }

    const p = new Date(prihodVal);
    const o = new Date(odhodVal);
    const noci = Math.round((o - p) / 86400000);

    if (noci <= 0) {
        // Popravi odhod
        const novOdhod = new Date(p); novOdhod.setDate(novOdhod.getDate() + 1);
        const odEl = document.getElementById('datumOdhod');
        if (odEl) odEl.value = novOdhod.toISOString().split('T')[0];
        posodobiCeno();
        return;
    }

    const skupaj = noci * _rezervacijaData.cenaNaNoc;

    document.getElementById('cenaPodrobnosti').textContent = `${_rezervacijaData.cenaNaNoc} €/noč × ${noci} ${noci === 1 ? 'noč' : noci < 5 ? 'noči' : 'noči'}`;
    document.getElementById('cenaVmesna').textContent = `${skupaj.toFixed(2)} €`;
    document.getElementById('cenaSkupaj').textContent = `${skupaj.toFixed(2)} €`;

    if (summary) summary.style.display = 'block';
}

async function potrdiRezervacijo() {
    const napaka  = document.getElementById('modalNapaka');
    const uspeh   = document.getElementById('modalUspeh');
    const btn     = document.getElementById('btnPotrdiRezervacijo');
    const btnTxt  = document.getElementById('btnPotrdiText');

    napaka?.classList.add('hidden');
    uspeh?.classList.add('hidden');

    const prihodVal = document.getElementById('datumPrihod')?.value;
    const odhodVal  = document.getElementById('datumOdhod')?.value;
    const gostov    = parseInt(document.getElementById('steviloGostov')?.textContent) || 1;

    // Validacija
    if (!prihodVal || !odhodVal) {
        if (napaka) { napaka.textContent = '❌ Prosimo izberite datume prihoda in odhoda.'; napaka.classList.remove('hidden'); }
        return;
    }
    if (new Date(odhodVal) <= new Date(prihodVal)) {
        if (napaka) { napaka.textContent = '❌ Datum odhoda mora biti po datumu prihoda.'; napaka.classList.remove('hidden'); }
        return;
    }

    // Preveri prijavo (JWT iz sessionStorage)
    const token = sessionStorage.getItem('token');
    if (!token) {
        if (napaka) { napaka.textContent = '❌ Za rezervacijo se morate prijaviti.'; napaka.classList.remove('hidden'); }
        setTimeout(() => { window.location.href = 'login.html'; }, 1500);
        return;
    }

    // Prikaži nalaganje
    if (btn) btn.disabled = true;
    if (btnTxt) btnTxt.textContent = 'Pošiljam rezervacijo...';

    // Pridobi ID prenočišča iz URL
    const urlParams = new URLSearchParams(window.location.search);
    const prenocisceId = urlParams.get('id') || 2;

    try {
        const response = await fetch(`${API_URL}/rezervacija`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                ID_prenocisce: prenocisceId,
                datum_prihoda: prihodVal,
                datum_odhoda:  odhodVal,
                stevilo_gostov: gostov
            })
        });

        if (response.ok) {
            uspeh?.classList.remove('hidden');
            if (btn) btn.disabled = true;
            if (btnTxt) btnTxt.textContent = '✅ Rezervirano!';
            setTimeout(() => zapriRezervacijo(), 3000);
        } else {
            const err = await response.json().catch(() => ({}));
            const msg = err.message || err.error || `Napaka strežnika (${response.status})`;
            if (napaka) { napaka.textContent = `❌ ${msg}`; napaka.classList.remove('hidden'); }
            if (btn) btn.disabled = false;
            if (btnTxt) btnTxt.textContent = 'Potrdi rezervacijo';
        }
    } catch (err) {
        if (napaka) { napaka.textContent = '❌ Napaka pri pošiljanju. Preveri, da server teče.'; napaka.classList.remove('hidden'); }
        if (btn) btn.disabled = false;
        if (btnTxt) btnTxt.textContent = 'Potrdi rezervacijo';
    }
}

// Zapri modal ob pritisku tipke Escape
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') zapriRezervacijo();
});
