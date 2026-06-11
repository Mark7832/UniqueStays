const profilToken = sessionStorage.getItem('token');

if (!profilToken) {
    window.location.href = 'login.html';
}

async function nalagajProfil() {
    try {
        const odgovor = await fetch('http://localhost:3000/api/auth/profil', {
            headers: { 'Authorization': 'Bearer ' + profilToken }
        });

        if (!odgovor.ok) {
            window.location.href = 'login.html';
            return;
        }

        const podatki = await odgovor.json();

        document.getElementById('profilIme').textContent = podatki.ime_uporabnika + ' ' + podatki.priimek_uporabnika;
        document.getElementById('profilEmail').textContent = podatki.email;
        document.getElementById('avatarInitials').textContent = podatki.ime_uporabnika.charAt(0).toUpperCase();
        const avatarSlika = document.getElementById('avatarSlika');
        if (podatki.profilna_slika) {
            avatarSlika.src = `/api/auth/profilna-slika/${podatki.ID_uporabnik}?t=${Date.now()}`;
            avatarSlika.classList.remove('hidden');
            document.getElementById('avatarInitials').classList.add('hidden');
        }

        document.getElementById('ime').value = podatki.ime_uporabnika || '';
        document.getElementById('priimek').value = podatki.priimek_uporabnika || '';
        document.getElementById('email').value = podatki.email || '';
        document.getElementById('drzava').value = podatki.drzava || '';
        document.getElementById('opis').value = podatki.opis || '';

        if (podatki.ustvarjen_od) {
            const datum = new Date(podatki.ustvarjen_od);
            document.getElementById('datumRegistracije').textContent = datum.toLocaleDateString('sl-SI');
        }

    } catch (err) {
        console.error('Napaka pri nalaganju profila:', err);
    }
}

document.getElementById('profilForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    const podatki = {
        ime_uporabnika: document.getElementById('ime').value,
        priimek_uporabnika: document.getElementById('priimek').value,
        email: document.getElementById('email').value,
        drzava: document.getElementById('drzava').value,
        opis: document.getElementById('opis').value
    };

    try {
        const odgovor = await fetch('http://localhost:3000/api/auth/profil', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + profilToken
            },
            body: JSON.stringify(podatki)
        });

        const rezultat = await odgovor.json();
        const sporocilo = document.getElementById('sporocilo');

        if (odgovor.ok) {
            sporocilo.textContent = '✓ ' + rezultat.sporocilo;
            sporocilo.className = 'px-6 py-4 rounded-2xl font-semibold text-sm bg-teal-50 border border-teal-200 text-teal-700';
            sporocilo.classList.remove('hidden');

            const uporabnik = JSON.parse(sessionStorage.getItem('uporabnik'));
            uporabnik.ime = podatki.ime_uporabnika;
            uporabnik.priimek = podatki.priimek_uporabnika;
            uporabnik.email = podatki.email;
            sessionStorage.setItem('uporabnik', JSON.stringify(uporabnik));

            nalagajProfil();
        } else {
            sporocilo.textContent = '✗ ' + rezultat.napaka;
            sporocilo.className = 'px-6 py-4 rounded-2xl font-semibold text-sm bg-red-50 border border-red-200 text-red-700';
            sporocilo.classList.remove('hidden');
        }

        setTimeout(() => sporocilo.classList.add('hidden'), 4000);

    } catch (err) {
        console.error('Napaka:', err);
    }
});

document.getElementById('gesloForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    const gesloNapaka = document.getElementById('gesloNapaka');
    gesloNapaka.classList.add('hidden');

    const novoGeslo = document.getElementById('novoGeslo').value;
    const potrdiGeslo = document.getElementById('potrdiGeslo').value;

    if (novoGeslo !== potrdiGeslo) {
        gesloNapaka.textContent = 'Novi gesli se ne ujemata.';
        gesloNapaka.classList.remove('hidden');
        return;
    }

    if (novoGeslo.length < 6) {
        gesloNapaka.textContent = 'Novo geslo mora imeti vsaj 6 znakov.';
        gesloNapaka.classList.remove('hidden');
        return;
    }

    try {
        const odgovor = await fetch('http://localhost:3000/api/auth/geslo', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + profilToken
            },
            body: JSON.stringify({
                staro_geslo: document.getElementById('staroGeslo').value,
                novo_geslo: novoGeslo
            })
        });

        const rezultat = await odgovor.json();
        const sporocilo = document.getElementById('sporocilo');

        if (odgovor.ok) {
            sporocilo.textContent = '✓ ' + rezultat.sporocilo;
            sporocilo.className = 'px-6 py-4 rounded-2xl font-semibold text-sm bg-teal-50 border border-teal-200 text-teal-700';
            sporocilo.classList.remove('hidden');
            this.reset();
        } else {
            gesloNapaka.textContent = rezultat.napaka;
            gesloNapaka.classList.remove('hidden');
        }

        setTimeout(() => sporocilo.classList.add('hidden'), 4000);

    } catch (err) {
        console.error('Napaka:', err);
    }
});

nalagajProfil();
naloziMojaPrenocisca();
naloziVezavoPovezava();

async function naloziMojaPrenocisca() {
    const token = sessionStorage.getItem('token'); // pobere JWT token
    if (!token) return; //ustavi ce ni prijavljen

    try {
        const odgovor = await fetch('/moja-prenocisca', {
            method: 'GET',
            headers: { 'Authorization': 'Bearer ' + token } //poslje token strezniku
        });
        const prenocisca = await odgovor.json();

        if (prenocisca.length === 0) return; // ce nima uporabnik prenocisc nic ne pokaze

        document.getElementById('mojaPrenocisca').classList.remove('hidden'); //prikaze seznam prenocisc
        const seznam = document.getElementById('seznamPrenocisc');
        seznam.innerHTML = '';// pocisti stare kartice da se seznam pravilno osvezi

        prenocisca.forEach(p => {
            // ustavri kartico in vpise podatke
            const div = document.createElement('div');
            div.className = 'flex items-center justify-between p-4 rounded-2xl border border-slate-200 bg-slate-50';
            div.innerHTML = `
                <div>
                    <p class="font-bold text-slate-900">${p.naziv}</p>
                    <p class="text-sm text-slate-500">${p.naslov} · ${p.cena_na_noc} €/noč</p>
                </div>
                <div class="flex gap-2">
                    <a href="dodaj_prenocisce.html?id=${p.ID_prenocisce}" class="px-4 py-2 rounded-full border-2 border-slate-300 text-slate-600 font-bold text-sm hover:border-teal-400 hover:text-teal-600 transition">Uredi</a>
                    <button onclick="izbrisiPrenocisce(${p.ID_prenocisce})" class="px-4 py-2 rounded-full border-2 border-red-200 text-red-500 font-bold text-sm hover:bg-red-50 transition">Briši</button>
                </div>
            `;
            seznam.appendChild(div);//doda na seznam
        });
    } catch (err) {
        console.error(err);
    }
}

async function izbrisiPrenocisce(id) {
    const modal = document.getElementById('brisiModal');
    modal.style.display = 'flex';

    return new Promise((resolve) => {
        document.getElementById('brisiDa').onclick = async () => {
            modal.style.display = 'none';
            const token = sessionStorage.getItem('token');
            try {
                await fetch(`/prenocisce/${id}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': 'Bearer ' + token }
                });
                naloziMojaPrenocisca();
            } catch (err) {
                console.error(err);
            }
            resolve();
        };

        document.getElementById('brisiNe').onclick = () => {
            modal.style.display = 'none';
            resolve();
        };
    });
}

//vezava doživetij na prenočišča
async function naloziVezavoPovezava() {
    const token = sessionStorage.getItem('token');
    if (!token) return;

    try {
        //vzporedno naloži prenočišča in doživetja
        const [resP, resD] = await Promise.all([
            fetch('/moja-prenocisca', { headers: { 'Authorization': 'Bearer ' + token } }),
            fetch('/api/dozivetja', { headers: { 'Authorization': 'Bearer ' + token } })
        ]);
        const prenocisca = await resP.json();
        const dozivetja = await resD.json();

        const sekcija = document.getElementById('sekcijaPovezava');
        const seznam = document.getElementById('vezavaSeznam');
        const prazno = document.getElementById('vezavaPrazno');

        //prikaže sekcijo samo če ima prenočišča
        if (!prenocisca.length) return;
        sekcija.classList.remove('hidden');

        if (!dozivetja.length) {
            prazno.classList.remove('hidden');
            return;
        }

        seznam.innerHTML = '';

        //en razdelek na prenočišče
        prenocisca.forEach(p => {
            //doživetja vezana na to prenočišče
            const vezana = dozivetja.filter(d => d.TK_prenocisce === p.ID_prenocisce);
            //doživetja, ki niso vezana nikamor, so prosta
            const prosta = dozivetja.filter(d => !d.TK_prenocisce);

            const razdelek = document.createElement('div');
            razdelek.innerHTML = `

                <!--prenočišče in število vezanih doživetij-->
                <div class="flex items-center justify-between mb-4">
                    <h3 class="font-extrabold text-slate-900 text-base flex items-center gap-2">
                        🏠 ${p.naziv}
                    </h3>
                    <span class="text-xs font-bold text-blue-400 bg-blue-100 px-3 py-1 rounded-full">
                        število doživetij: ${vezana.length}
                    </span>
                </div>

                <!--vezana doživetja - klic funkcije karticeVezano-->
                <div id="vezana-${p.ID_prenocisce}" class="space-y-2 mb-3">
                    ${vezana.length === 0
                    ? `<p class="text-sm text-slate-400 italic px-1">Ni vezanih doživetij.</p>`
                    : vezana.map(d => karticeVezano(d, p.ID_prenocisce)).join('')
                }
                </div>

                <!--dodaj doživetje na to prenočišče-->
                ${prosta.length > 0 ? `
                <div class="flex gap-2 mt-3">
                    <select id="dodajSelect-${p.ID_prenocisce}"
                        class="flex-1 px-4 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 font-semibold text-sm outline-none focus:border-teal-400 focus:bg-white transition appearance-none cursor-pointer">
                        <option value="">Izberi prosto doživetje…</option>
                        ${prosta.map(d =>
                    `<option value="${d.ID_dozivetje}">${d.naziv} (€ ${parseFloat(d.doplacilo).toFixed(2)})</option>`
                ).join('')}
                    </select>
                    <button onclick="veziDozivetje(${p.ID_prenocisce})"
                        class="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-teal-500 text-white font-bold text-sm hover:scale-[1.02] transition-all duration-200 shadow">
                        Veži
                    </button>
                </div>` : `<p class="text-xs text-slate-400 italic mt-2">Vsa doživetja so že vezana.</p>`}

                <div class="border-b border-slate-100 mt-6"></div>
            `;
            seznam.appendChild(razdelek);
        });

    } catch (err) {
        console.error('Napaka pri nalaganju vezave:', err);
    }
}

//vezana doživetja
function karticeVezano(d, idPrenocisca) {
    return `
        <div class="flex items-center justify-between px-4 py-3 rounded-2xl border border-teal-100 bg-teal-50">
            <div class="min-w-0">
                <p class="font-bold text-slate-900 text-sm truncate">${d.naziv}</p>
                <p class="text-xs text-teal-600 font-semibold">€ ${parseFloat(d.doplacilo).toFixed(2)} doplačilo</p>
            </div>
            <button onclick="odveziDozivetje(${d.ID_dozivetje}, ${idPrenocisca})"
                class="ml-3 shrink-0 px-3 py-1.5 rounded-full border-2 border-red-200 text-red-500 font-bold text-xs hover:bg-red-50 transition">
                Odveži
            </button>
        </div>
    `;
}

//veži doživetje na prenočišče
async function veziDozivetje(idPrenocisca) {
    const token = sessionStorage.getItem('token');
    const sel = document.getElementById(`dodajSelect-${idPrenocisca}`);
    const idDoz = sel.value;
    if (!idDoz) return;

    try {
        const res = await fetch(`/api/dozivetje/${idDoz}/vezava`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
            body: JSON.stringify({ TK_prenocisce: parseInt(idPrenocisca) })
        });
        const r = await res.json();
        if (res.ok) {
            prikaziSporociloPovezava('✓ Doživetje je bilo vezano na prenočišče.', true);
            await naloziVezavoPovezava(); // osveži
        } else {
            prikaziSporociloPovezava('✗ ' + (r.napaka || 'Napaka.'), false);
        }
    } catch {
        prikaziSporociloPovezava('✗ Napaka pri vezavi.', false);
    }
}

//odveži doživetje s prenočišča
async function odveziDozivetje(idDoz, idPrenocisca) {
    const token = sessionStorage.getItem('token');
    try {
        const res = await fetch(`/api/dozivetje/${idDoz}/vezava`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
            body: JSON.stringify({ TK_prenocisce: null })
        });
        const r = await res.json();
        if (res.ok) {
            prikaziSporociloPovezava('✓ Doživetje odstranjeno s prenočišča.', true);
            await naloziVezavoPovezava();
        } else {
            prikaziSporociloPovezava('✗ ' + (r.napaka || 'Napaka.'), false);
        }
    } catch {
        prikaziSporociloPovezava('✗ Napaka pri odvezavi.', false);
    }
}

//prikaz sporočila
function prikaziSporociloPovezava(besedilo, uspeh) {
    const el = document.getElementById('sporociloPovezava');
    el.textContent = besedilo;
    el.className = uspeh
        ? 'mx-8 mt-6 px-5 py-3.5 rounded-2xl font-semibold text-sm bg-teal-50 border border-teal-200 text-teal-700'
        : 'mx-8 mt-6 px-5 py-3.5 rounded-2xl font-semibold text-sm bg-red-50 border border-red-200 text-red-700';
    el.classList.remove('hidden');
    setTimeout(() => el.classList.add('hidden'), 4000);
}

// PRILJUBLJENO

// Vrne HTML kartico za eno priljubljeno prenočišče
function renderPriljubljena(p) {
    return `
        <div class="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex justify-between items-center hover:shadow-md transition">

            <a href="podrobnosti.html?id=${p.id}" class="flex-1">
                <div class="font-bold text-lg">${p.naziv}</div>
                <div class="text-sm text-slate-500">${p.cena} € / noč</div>
            </a>

            <button onclick="odstraniPriljubljeno(${p.id})"
                class="text-red-500 text-xl hover:scale-110 transition">
                ✕
            </button>

        </div>
    `;
}

// Naloži priljubljena prenočišča uporabnika
async function naloziPriljubljene() {
    const token = sessionStorage.getItem('token');
    if (!token) return;

    try {
        const res = await fetch('http://localhost:3000/api/priljubljeno', {
            headers: {
                'Authorization': 'Bearer ' + token
            }
        });

        const data = await res.json();
        const el = document.getElementById('seznamPriljubljenih');

        if (!data.length) {
            el.innerHTML = `
                <p class="text-slate-500 italic">
                    Nimate še priljubljenih prenočišč
                </p>`;
            return;
        }

        el.innerHTML = data.map(renderPriljubljena).join('');

    } catch (err) {
        console.error('Napaka pri nalaganju priljubljenih:', err);
    }
}

// Odstrani priljubljeno prenočišče iz seznama
async function odstraniPriljubljeno(id) {
    const modal = document.getElementById('priljubljeniModal');
    modal.style.display = 'flex';

    return new Promise((resolve) => {
        document.getElementById('priljubljeniDa').onclick = async () => {
            modal.style.display = 'none';
            const token = sessionStorage.getItem('token');
            if (!token) return;
            try {
                await fetch(`http://localhost:3000/api/priljubljeno/${id}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': 'Bearer ' + token }
                });
                naloziPriljubljene();
            } catch (err) {
                console.error('Napaka pri odstranjevanju:', err);
            }
            resolve();
        };

        document.getElementById('priljubljeniNe').onclick = () => {
            modal.style.display = 'none';
            resolve();
        };
    });
}

// samodejno nalozi seznam priljubljenih ob odprtju strani
document.addEventListener("DOMContentLoaded", () => {
    naloziPriljubljene();
});

// MOJE REZERVACIJE
document.addEventListener("DOMContentLoaded", () => {
    naloziMojeRezervacije();
});

async function naloziMojeRezervacije() {
    const token = sessionStorage.getItem('token');
    if (!token) return;

    const seznam = document.getElementById('seznamRezervacij');

    try {
        const res = await fetch('http://localhost:3000/api/moje-rezervacije', {
            headers: { 'Authorization': 'Bearer ' + token }
        });

        const rezervacije = await res.json();

        if (!rezervacije.length) {
            seznam.innerHTML = `<p class="text-slate-400 italic text-sm">Nimate še nobene rezervacije.</p>`;
            return;
        }

        // Za vsako zaključeno rezervacijo preveri upravičenost
        const rendered = await Promise.all(rezervacije.map(r => renderRezervacija(r, token)));
        seznam.innerHTML = rendered.join('');

    } catch (err) {
        console.error('Napaka pri nalaganju rezervacij:', err);
        seznam.innerHTML = `<p class="text-red-400 italic text-sm">Napaka pri nalaganju rezervacij.</p>`;
    }
}

async function renderRezervacija(r, token) {
    const prihod = new Date(r.datum_od);
    const odhod = new Date(r.datum_do);
    const zdaj = new Date();
    const razlikaUre = (prihod - zdaj) / (1000 * 60 * 60);

    const formatDatum = (d) => d.toLocaleDateString('sl-SI', { day: 'numeric', month: 'long', year: 'numeric' });
    const noci = Math.round((odhod - prihod) / 86400000);
    const cena = noci * (r.cena_na_noc || 0);

    const vPreteklosti = odhod < zdaj;
    const moznoPreklicati = !vPreteklosti && razlikaUre >= 48;

    // Preveri ali lahko oceni (samo za zaključene)
    let gumbOceni = '';
    if (vPreteklosti && token && r.TK_prenocisce) {
        try {
            const res = await fetch(`http://localhost:3000/api/komentar/upravicen/${r.TK_prenocisce}`, {
                headers: { 'Authorization': 'Bearer ' + token }
            });
            const data = await res.json();
            if (data.upravicen) {
                gumbOceni = `
                    <a href="podrobnosti.html?id=${r.ID_prenocisce}#ocena"
                        class="shrink-0 px-5 py-2.5 rounded-full border-2 border-amber-300 text-amber-600 font-bold text-sm hover:bg-amber-50 hover:border-amber-400 transition whitespace-nowrap">
                        ⭐ Oceni bivanje
                    </a>`;
            } else if (data.jeZeKomentiral) {
                gumbOceni = `
                    <a href="podrobnosti.html?id=${r.ID_prenocisce}#ocena"
                        class="shrink-0 px-5 py-2.5 rounded-full border-2 border-teal-300 text-teal-600 font-bold text-sm hover:bg-teal-50 hover:border-teal-400 transition whitespace-nowrap">
                        ✅ Že ocenjeno
                    </a>`;
            }
        } catch { }
    }

    const statusBadge = vPreteklosti
        ? `<span class="inline-block px-3 py-1 rounded-full bg-purple-100 text-purple-500 text-xs font-bold">✓ Zaključena</span>`
        : razlikaUre < 48
            ? `<span class="inline-block px-3 py-1 rounded-full bg-amber-100 text-amber-600 text-xs font-bold">⚠️ Ni mogoče preklicati</span>`
            : `<span class="inline-block px-3 py-1 rounded-full bg-teal-100 text-teal-700 text-xs font-bold">✓ Aktivna</span>`;

    return `
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl border border-slate-200 bg-slate-50 hover:shadow-sm transition">
            <div class="flex-1 min-w-0">
                <div class="flex items-center gap-3 mb-1 flex-wrap">
                    <p class="font-extrabold text-slate-900 text-base">${r.naziv}</p>
                    ${statusBadge}
                </div>
                <p class="text-sm text-slate-500 mb-2">${r.naslov || ''}</p>
                <div class="flex flex-wrap gap-4 text-sm text-slate-600">
                    <span class="justify-between gap-2 p-2 rounded-2xl border border-red-300">📅 <strong>${formatDatum(prihod)}</strong> → <strong>${formatDatum(odhod)}</strong></span>
                    <span class="justify-between gap-2 p-2 rounded-2xl border border-amber-300">🌙 ${noci} ${noci === 1 ? 'noč' : 'noči'}</span>
                    <span class="justify-between gap-2 p-2 rounded-2xl border border-emerald-300">💶 ${cena.toFixed(2)} €</span>
                </div>
                <p class="text-xs text-slate-400 mt-1">Številka rezervacije #${r.ID_rezervacija} · oddana ${new Date(r.datum_rezervacije).toLocaleDateString('sl-SI')}</p>
            </div>
            ${gumbOceni}
            ${moznoPreklicati ? `
            <button onclick="prekliciRezervacijo(${r.ID_rezervacija})"
                class="shrink-0 px-5 py-2.5 rounded-full border-2 border-red-200 text-red-500 font-bold text-sm hover:bg-red-50 hover:border-red-400 transition whitespace-nowrap">
                ❌ Prekliči
            </button>` : ''}
        </div>
    `;
}

async function prekliciRezervacijo(id) {
    const modal = document.getElementById('preklicModal');
    modal.style.display = 'flex';

    return new Promise((resolve) => {
        document.getElementById('preklicDa').onclick = async () => {
            modal.style.display = 'none';

            const token = sessionStorage.getItem('token');
            const sporocilo = document.getElementById('sporociloRezervacija');

            try {
                const res = await fetch(`http://localhost:3000/api/rezervacija/${id}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': 'Bearer ' + token }
                });

                const podatki = await res.json();
                sporocilo.classList.remove('hidden');

                if (res.ok) {
                    sporocilo.textContent = '✓ ' + podatki.sporocilo + ' Poslali smo vam potrditveni e-mail.';
                    sporocilo.className = 'mx-8 mt-6 px-5 py-3.5 rounded-2xl font-semibold text-sm bg-teal-50 border border-teal-200 text-teal-700';
                    await naloziMojeRezervacije();
                } else {
                    sporocilo.textContent = '✗ ' + (podatki.napaka || 'Napaka pri preklicu.');
                    sporocilo.className = 'mx-8 mt-6 px-5 py-3.5 rounded-2xl font-semibold text-sm bg-red-50 border border-red-200 text-red-700';
                }

                setTimeout(() => sporocilo.classList.add('hidden'), 5000);
            } catch (err) {
                console.error('Napaka pri preklicu:', err);
            }
            resolve();
        };

        document.getElementById('preklicNe').onclick = () => {
            modal.style.display = 'none';
            resolve();
        };
    });
}

async function uploadProfilnaSlika(input) {
    const file = input.files[0];
    if (!file) return;
    const token = sessionStorage.getItem('token');
    const formData = new FormData();
    formData.append('slika', file);
    try {
        const res = await fetch('http://localhost:3000/api/auth/profilna-slika', {
            method: 'POST',
            headers: { 'Authorization': 'Bearer ' + token },
            body: formData
        });
        const r = await res.json();
        if (res.ok) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const avatarSlika = document.getElementById('avatarSlika');
                avatarSlika.src = e.target.result;
                avatarSlika.classList.remove('hidden');
                document.getElementById('avatarInitials').classList.add('hidden');
            };
            reader.readAsDataURL(file);
        } else {
            alert(r.napaka || 'Napaka pri nalaganju.');
        }
    } catch (err) {
        console.error(err);
    }
}