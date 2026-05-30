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
        document.getElementById('avatarKrog').textContent = podatki.ime_uporabnika.charAt(0).toUpperCase();

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

document.getElementById('profilForm').addEventListener('submit', async function(e) {
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

document.getElementById('gesloForm').addEventListener('submit', async function(e) {
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
    if (!confirm('Ste prepričani, da želite izbrisati to prenočišče?')) return;
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
}