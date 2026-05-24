async function isci() {
    if (!document.getElementById('rezultati')) return;
    try {
        const form = document.getElementById('isciForma');
        const data = new FormData(form);
        const params = new URLSearchParams(data);

        const datumOd = document.querySelector('input[name="datum_od"]').value;
        const datumDo = document.querySelector('input[name="datum_do"]').value;

        // Preveri da je odhod po prihodu
        if (datumOd && datumDo && datumOd >= datumDo) {
            document.getElementById('rezultati').innerHTML = `
                <div class="text-center py-20 text-red-400">
                    <p class="text-5xl mb-4">📅</p>
                    <p class="text-xl font-semibold">Datum odhoda mora biti po datumu prihoda.</p>
                </div>
            `;
            document.getElementById('resultsCount').textContent = '0 rezultatov';
            return;
        }

        const res = await fetch(
            `http://localhost:3000/isci_prenocisca?${params.toString()}`
        );

        const prenocisca = await res.json();

        zadnjaPrenocisca = Array.isArray(prenocisca) ? prenocisca : [];

        // Če je zemljevid aktiven, ga posodobi
        if (!document.getElementById('zemljevidView').classList.contains('hidden')) {
            prikaziZemljevid();
        }

        const container = document.getElementById('rezultati');
        const count = document.getElementById('resultsCount');

        container.innerHTML = '';
        count.textContent = Array.isArray(prenocisca) ? `${prenocisca.length} rezultatov` : '0 rezultatov';

        if (!Array.isArray(prenocisca) || prenocisca.length === 0) {
            container.innerHTML = `
                <div class="text-center py-20 text-slate-400">
                    <p class="text-5xl mb-4">🔍</p>
                    <p class="text-xl font-semibold">Ni rezultatov za vaše iskanje.</p>
                    <p class="mt-2">Poskusite spremeniti filtre.</p>
                </div>
            `;
            return;
        }

        let html = '';

        prenocisca.forEach(p => {
            const ocena = p.povprecna_ocena ? `⭐ ${p.povprecna_ocena}` : '';
            const slika = p.cover_slika || 'images/default.jpg';
            const tagi = p.tagi ? JSON.parse(p.tagi) : [];
            const zdaj = new Date();
            const dodano = new Date(p.datum_dodano);
            const dniRazlika = (zdaj - dodano) / (1000 * 60 * 60 * 24);

            const znacke = [];
            if (p.povprecna_ocena >= 4.8) 
                znacke.push(`<span class="px-3 py-2 rounded-full bg-purple-100 text-purple-700 text-sm font-bold">🏆 Gostova izbira</span>`);
            if (p.cena_na_noc > 300) 
                znacke.push(`<span class="px-3 py-2 rounded-full bg-blue-100 text-blue-700 text-sm font-bold">💎 Premium</span>`);
            if (dniRazlika <= 30) 
                znacke.push(`<span class="px-3 py-2 rounded-full bg-emerald-100 text-emerald-700 text-sm font-bold">✨ Novo</span>`);

            html += `
            <article class="group bg-white border border-slate-200 rounded-[32px] overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 grid lg:grid-cols-[380px_1fr]">

                <!-- Slika -->
                <div class="relative min-h-[280px] lg:min-h-full overflow-hidden">
                    <img src="${slika}" alt="${p.naziv}"
                         class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">

                    <div class="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-slate-950/10 to-transparent"></div>

                    <span class="absolute top-5 left-5 px-4 py-2 rounded-full bg-white/20 backdrop-blur-md text-white text-sm font-bold border border-white/30">
                        🏠 ${p.tip_prenocisca}
                    </span>

                    <span class="absolute bottom-5 left-5 px-4 py-2 rounded-full bg-slate-950/60 backdrop-blur-md text-white text-sm font-bold">
                        ${p.naslov}
                    </span>
                </div>

                <!-- Vsebina -->
                <div class="p-7 md:p-9 flex flex-col">

                    <!--sezona & ocena-->
                    <div class="flex flex-wrap items-center justify-between mb-3 gap-2">
                        <div class="flex flex-wrap items-center gap-2">
                            <span class="px-4 py-2 rounded-full bg-pink-100 text-pink-700 text-sm font-bold">
                                🌼 ${p.sezona}
                            </span>
                            ${znacke.join('')}
                        </div>
                        ${ocena ? `<span class="px-3 py-2 rounded-full bg-amber-100 text-amber-700 text-sm font-bold">${ocena}</span>` : ''}
                    </div>

                    <!--ime in lokacija-->
                    <h3 class="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mb-3">
                        ${p.naziv}
                    </h3>

                    <p class="text-sm font-bold text-teal-600 uppercase tracking-widest mb-4">
                        📍 ${p.naslov}
                    </p>

                    <!--opis-->
                    <p class="text-slate-500 leading-relaxed mb-7 max-w-3xl">
                        ${p.opis_prenocisca}
                    </p>

                    <!--značke-->
                    <div class="flex flex-wrap gap-3 mb-8">
                        <span class="px-4 py-2 rounded-full bg-slate-100 text-slate-700 text-sm font-bold">
                            👥 do ${p.max_gostov} gostov
                        </span>

                        <span class="px-4 py-2 rounded-full bg-slate-100 text-slate-700 text-sm font-bold">
                            🛏️ ${p.stevilo_sob} ${p.stevilo_sob === 1 ? 'soba' : 'sobe'}
                        </span>

                        ${p.wifi == 1        ? `<span class="px-4 py-2 rounded-full bg-slate-100 text-slate-700 text-sm font-bold">📶 Wi-Fi</span>` : ''}
                        ${p.bazen == 1       ? `<span class="px-4 py-2 rounded-full bg-slate-100 text-slate-700 text-sm font-bold">🏊 Zasebni bazen</span>` : ''}
                        ${p.parking == 1     ? `<span class="px-4 py-2 rounded-full bg-slate-100 text-slate-700 text-sm font-bold">🅿️ Parking</span>` : ''}
                        ${p.zajtrk == 1      ? `<span class="px-4 py-2 rounded-full bg-slate-100 text-slate-700 text-sm font-bold">🥐 Zajtrk vključen</span>` : ''}
                        ${p.razgled == 1     ? `<span class="px-4 py-2 rounded-full bg-slate-100 text-slate-700 text-sm font-bold">🌄 Panoramski razgled</span>` : ''}
                        ${p.ljubljencki == 1 ? `<span class="px-4 py-2 rounded-full bg-slate-100 text-slate-700 text-sm font-bold">🐾 Hišni ljubljenčki</span>` : ''}
                        ${p.trajnostno == 1  ? `<span class="px-4 py-2 rounded-full bg-slate-100 text-slate-700 text-sm font-bold">🌿 Trajnostno</span>` : ''}

                        ${tagi.map(t => `
                            <span class="px-4 py-2 rounded-full bg-slate-100 text-slate-700 text-sm font-bold">
                                ${t.emoji} ${t.naziv}
                            </span>
                        `).join('')}
                    </div>

                    <!--cena in gumb za ogled ponudbe-->
                    <div class="mt-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5 pt-6 border-t border-slate-100">
                        <p class="text-slate-500 font-semibold">
                            od
                            <span class="text-3xl font-extrabold text-slate-900">${p.cena_na_noc} €</span>
                            / noč
                        </p>
                        <a href="podrobnosti.html?id=${p.ID_prenocisce}"
                           class="px-7 py-3.5 rounded-full bg-gradient-to-r from-blue-600 to-teal-500 text-white font-bold hover:scale-[1.03] transition-all duration-200 shadow-lg text-center">
                            Ogled ponudbe
                        </a>
                    </div>

                </div>
            </article>
            `;
        });

        container.innerHTML = html;

    } catch (err) {
        console.error('Napaka pri iskanju:', err);
        const container = document.getElementById('rezultati');
        container.innerHTML = `
            <div class="text-center py-20 text-red-400">
                <p class="text-5xl mb-4">⚠️</p>
                <p class="text-xl font-semibold">Napaka pri povezavi s strežnikom.</p>
                <p class="mt-2 text-sm">Preverite ali strežnik teče na portu 3000.</p>
            </div>
        `;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Zapolni formo iz URL parametrov (ko prideš iz index.html)
    const urlParams = new URLSearchParams(window.location.search);
    urlParams.forEach((value, key) => {
        const el = document.querySelector(`[name="${key}"]`);
        if (!el) return;
        if (el.type === 'checkbox') {
            el.checked = value === 'on';
        } else {
            el.value = value;
        }
    });

    isci();

    document.querySelectorAll('#isciForma input[type="date"], #isciForma input[type="number"], #isciForma select, #isciForma input[type="checkbox"]').forEach(el => {
        el.addEventListener('change', isci);
    });
    document.querySelector('input[name="destinacija"]').addEventListener('input', isci);
});

//Funkcija za preusmeritev iz index.html na iskanje.html
function isciInPreusmeri() {
    const form = document.getElementById('isciForma');
    const data = new FormData(form);
    const params = new URLSearchParams(data);
    window.location.href = `iskanje.html?${params.toString()}`;
}

//Funkcija za prikaz zemljevida
let map = null;
let markers = [];

function preklop(tip) {
    const seznam = document.getElementById('seznamView');
    const zemljevidView = document.getElementById('zemljevidView');
    const btnSeznam = document.getElementById('btnSeznam');
    const btnZemljevid = document.getElementById('btnZemljevid');

    if (tip === 'zemljevid') {
        seznam.classList.add('hidden');
        zemljevidView.classList.remove('hidden');
        btnSeznam.className = 'flex items-center gap-2 px-6 py-3 rounded-full bg-white border-2 border-slate-200 text-slate-700 font-bold text-sm shadow-lg hover:border-blue-400 hover:text-blue-600 transition-all duration-200 hover:-translate-y-1';
        btnZemljevid.className = 'flex items-center gap-2 px-6 py-3 rounded-full bg-slate-900 text-white font-bold text-sm shadow-lg hover:bg-blue-600 transition-all duration-200 hover:-translate-y-1';
        prikaziZemljevid();
    } else {
        seznam.classList.remove('hidden');
        zemljevidView.classList.add('hidden');
        btnSeznam.className = 'flex items-center gap-2 px-6 py-3 rounded-full bg-slate-900 text-white font-bold text-sm shadow-lg hover:bg-blue-600 transition-all duration-200 hover:-translate-y-1';
        btnZemljevid.className = 'flex items-center gap-2 px-6 py-3 rounded-full bg-white border-2 border-slate-200 text-slate-700 font-bold text-sm shadow-lg hover:border-blue-400 hover:text-blue-600 transition-all duration-200 hover:-translate-y-1';
    }
}

let zadnjaPrenocisca = [];

function prikaziZemljevid() {
    if (!map) {
        map = L.map('zemljevid').setView([20, 0], 2);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap'
        }).addTo(map);
    }

    // Zbriši stare markerje
    markers.forEach(m => m.remove());
    markers = [];

    zadnjaPrenocisca.forEach(p => {
        if (!p.koordinate) return;
        const [lat, lng] = p.koordinate.split(',').map(Number);
        if (isNaN(lat) || isNaN(lng)) return;

        const marker = L.marker([lat, lng]).addTo(map);
        marker.bindPopup(`
            <div style="min-width:200px">
                <strong style="font-size:16px">${p.naziv}</strong><br>
                <span style="color:#6b7280">📍 ${p.naslov}</span><br>
                <span style="font-size:18px;font-weight:bold">${p.cena_na_noc} €</span> / noč<br>
                ${p.povprecna_ocena ? `⭐ ${p.povprecna_ocena}<br>` : ''}
                <a href="podrobnosti.html?id=${p.ID_prenocisce}" 
                   style="display:inline-block;margin-top:8px;padding:6px 14px;background:#2563eb;color:white;border-radius:20px;text-decoration:none;font-weight:bold;font-size:13px">
                    Ogled ponudbe
                </a>
            </div>
        `);
        markers.push(marker);
    });

    // Prilagodi pogled na markerje
    if (markers.length > 0) {
        const group = L.featureGroup(markers);
        map.fitBounds(group.getBounds().pad(0.2));
    }
}