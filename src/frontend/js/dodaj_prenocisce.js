var slikaCounter = 0;
document.addEventListener('DOMContentLoaded', function () {
    slikaCounter = 0;
});
// Preveri ali gre za urejanje (URL vsebuje ?id=)
const urlParams = new URLSearchParams(window.location.search);
const urejanjeId = urlParams.get('id');

if (urejanjeId) {
    document.querySelector('[type="submit"]').textContent = 'Posodobi prenočišče';
    const token = sessionStorage.getItem('token');
    fetch('/prenocisce/' + urejanjeId, {
        headers: { 'Authorization': 'Bearer ' + token }
    })
        .then(r => r.json())
        .then(p => {
            document.querySelector('[name="naziv"]').value = p.naziv || '';
            document.querySelector('[name="tip_prenocisca"]').value = p.tip_prenocisca || '';
            document.querySelector('[name="opis_prenocisca"]').value = p.opis_prenocisca || '';
            document.querySelector('[name="naslov"]').value = p.naslov || '';
            document.querySelector('[name="koordinate"]').value = p.koordinate || '';
            document.querySelector('[name="cena_na_noc"]').value = p.cena_na_noc || '';
            document.querySelector('[name="max_gostov"]').value = p.max_gostov || '';
            document.querySelector('[name="stevilo_sob"]').value = p.stevilo_sob || '';
            document.querySelector('[name="sezona"]') && (document.querySelector('[name="sezona"]').value = p.sezona || '');
            document.querySelector('[name="bazen"]') && (document.querySelector('[name="bazen"]').checked = p.bazen);
            document.querySelector('[name="parking"]') && (document.querySelector('[name="parking"]').checked = p.parking);
            document.querySelector('[name="wifi"]') && (document.querySelector('[name="wifi"]').checked = p.wifi);
            document.querySelector('[name="zajtrk"]') && (document.querySelector('[name="zajtrk"]').checked = p.zajtrk);
            document.querySelector('[name="ljubljencki"]') && (document.querySelector('[name="ljubljencki"]').checked = p.ljubljencki);
            document.querySelector('[name="razgled"]') && (document.querySelector('[name="razgled"]').checked = p.razgled);
            document.querySelector('[name="trajnostno"]') && (document.querySelector('[name="trajnostno"]').checked = p.trajnostno);

            // Naloži termine
            if (p.termini && p.termini.length > 0) {
                p.termini.forEach(t => {
                    dodajTermin();
                    const vnosi = document.querySelectorAll('.termin-vnos');
                    const zadnji = vnosi[vnosi.length - 1];
                    zadnji.querySelector('[name="termin_od[]"]').value = t.datum_od.split('T')[0];
                    zadnji.querySelector('[name="termin_do[]"]').value = t.datum_do.split('T')[0];
                    zadnji.querySelector('[name="termin_razlog[]"]').value = t.razlog || '';
                });
            }

            // Naloži obstoječe slike
            if (p.slike && p.slike.length > 0) {
                const seznam = document.getElementById('slike-seznam');
                seznam.innerHTML = '';
                p.slike.forEach((slika) => {
                    var vrstica = document.createElement('div');
                    vrstica.className = 'flex items-center gap-4 p-3 rounded-2xl border bg-slate-50 ' + (slika.cover ? 'border-teal-400' : 'border-slate-200');
                    vrstica.id = 'obstojecaSlika-' + slika.ID_slika;
                    vrstica.innerHTML =
                        '<img src="/images/' + slika.ime_slike + '" class="w-16 h-12 object-cover rounded-xl flex-shrink-0" />' +
                        '<span class="flex-1 text-sm font-semibold text-slate-600 truncate">' + slika.ime_slike + '</span>' +
                        '<input type="hidden" name="obstojecaSlikaId[]" value="' + slika.ID_slika + '" />' +
                        '<button type="button" onclick="oznaciCoverObstojeco(\'' + slika.ID_slika + '\')" id="zvezda-obs-' + slika.ID_slika + '" class="text-xl transition-transform hover:scale-125 ' + (slika.cover ? 'text-yellow-400' : 'text-slate-300') + '">' +
                        (slika.cover ? '★' : '☆') +
                        '</button>' +
                        (slika.cover ? '<span class="text-xs font-bold text-teal-600 bg-teal-50 px-2 py-1 rounded-full" id="cover-znak-obs-' + slika.ID_slika + '">Naslovna slika</span>' : '<span class="text-xs text-slate-300 px-2 py-1 rounded-full" id="cover-znak-obs-' + slika.ID_slika + '"></span>') +
                        '<button type="button" onclick="odstraniObstojecoSliko(' + slika.ID_slika + ')" class="text-red-400 hover:text-red-600 font-bold text-lg ml-2">✕</button>';
                    seznam.appendChild(vrstica);
                });
            }
        });
}

function prikaziSlike(input) {
    if (!input) return;
    var seznam = document.getElementById('slike-seznam');

    if (!input.files || input.files.length === 0) return;

    // cover-index se nastavi v zanki

    for (var i = 0; i < input.files.length; i++, slikaCounter++) {
        var file = input.files[i];
        var url = URL.createObjectURL(file);
        var obstojeciCover = document.querySelector('[id^="zvezda-obs-"].text-yellow-400, [id^="zvezda-"].text-yellow-400');
        var obstojeciCover2 = document.querySelector('.text-yellow-400');
        var je_cover = !obstojeciCover2;

        var vrstica = document.createElement('div');
        vrstica.className = 'flex items-center gap-4 p-3 rounded-2xl border bg-slate-50 ' + (je_cover ? 'border-teal-400' : 'border-slate-200');
        vrstica.id = 'slika-vrstica-' + slikaCounter;

        vrstica.innerHTML =
            '<img src="' + url + '" class="w-16 h-12 object-cover rounded-xl flex-shrink-0" />' +
            '<span class="flex-1 text-sm font-semibold text-slate-600 truncate">' + file.name + '</span>' +
            '<button type="button" onclick="oznaCiCover(' + slikaCounter + ')" id="zvezda-' + slikaCounter + '" class="text-xl transition-transform hover:scale-125 ' + (je_cover ? 'text-yellow-400' : 'text-slate-300') + '" title="Nastavi kot naslovno sliko">' +
            (je_cover ? '★' : '☆') +
            '</button>' +
            (je_cover ? '<span class="text-xs font-bold text-teal-600 bg-teal-50 px-2 py-1 rounded-full" id="cover-znak-' + slikaCounter + '">Naslovna slika</span>' : '<span class="text-xs text-slate-300 px-2 py-1 rounded-full" id="cover-znak-' + slikaCounter + '"></span>')
            + '<button type="button" onclick="odstraniNovoSliko(this)" class="text-red-400 hover:text-red-600 font-bold text-lg ml-2">✕</button>';

        seznam.appendChild(vrstica);
        if (je_cover) {
            document.getElementById('cover-index').value = slikaCounter;
        }
    }
}

function oznaCiCover(index) {
    // Pobrisi vse cover oznake - obstojece
    document.querySelectorAll('[id^="zvezda-obs-"]').forEach(z => {
        z.textContent = '☆';
        z.className = 'text-xl transition-transform hover:scale-125 text-slate-300';
    });
    document.querySelectorAll('[id^="cover-znak-obs-"]').forEach(z => {
        z.textContent = '';
        z.className = 'text-xs text-slate-300 px-2 py-1 rounded-full';
    });

    // Pobrisi VSE nove cover oznake
    document.querySelectorAll('[id^="zvezda-"]').forEach(z => {
        if (!z.id.includes('obs')) {
            z.textContent = '☆';
            z.className = 'text-xl transition-transform hover:scale-125 text-slate-300';
        }
    });
    document.querySelectorAll('[id^="cover-znak-"]').forEach(z => {
        if (!z.id.includes('obs')) {
            z.textContent = '';
            z.className = 'text-xs text-slate-300 px-2 py-1 rounded-full';
        }
    });
    document.querySelectorAll('[id^="slika-vrstica-"]').forEach(v => {
        v.className = 'flex items-center gap-4 p-3 rounded-2xl border bg-slate-50 border-slate-200';
    });

    // Označi izbrano
    document.getElementById('cover-index').value = index;
    var vrstica = document.getElementById('slika-vrstica-' + index);
    var zvezda = document.getElementById('zvezda-' + index);
    var znak = document.getElementById('cover-znak-' + index);
    if (vrstica) vrstica.className = 'flex items-center gap-4 p-3 rounded-2xl border bg-slate-50 border-teal-400';
    if (zvezda) { zvezda.textContent = '★'; zvezda.className = 'text-xl transition-transform hover:scale-125 text-yellow-400'; }
    if (znak) { znak.textContent = 'Naslovna slika'; znak.className = 'text-xs font-bold text-teal-600 bg-teal-50 px-2 py-1 rounded-full'; }
}

function dodajTermin() {
    var container = document.getElementById('termini-container');

    var novDiv = document.createElement('div');
    novDiv.className = 'termin-vnos grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200 relative';

    novDiv.innerHTML =
        '<div>' +
        '<label class="block text-xs uppercase tracking-widest font-bold text-slate-400 mb-2">Datum od</label>' +
        '<input type="date" name="termin_od[]" class="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white font-semibold outline-none focus:border-teal-400 transition" />' +
        '</div>' +
        '<div>' +
        '<label class="block text-xs uppercase tracking-widest font-bold text-slate-400 mb-2">Datum do</label>' +
        '<input type="date" name="termin_do[]" class="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white font-semibold outline-none focus:border-teal-400 transition" />' +
        '</div>' +
        '<div class="relative">' +
        '<label class="block text-xs uppercase tracking-widest font-bold text-slate-400 mb-2">Razlog</label>' +
        '<input type="text" name="termin_razlog[]" placeholder="Vzdrževanje" class="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white font-semibold outline-none focus:border-teal-400 transition" />' +
        '<button type="button" onclick="odstraniTermin(this)" class="absolute -top-1 -right-1 text-slate-400 hover:text-red-500 font-bold text-xs transition">Odstrani</button>' +
        '</div>';

    container.appendChild(novDiv);
}

function odstraniTermin(gumb) {
    gumb.closest('.termin-vnos').remove();
}

function prikaziPredogled(input) {
    var wrapper = input.nextElementSibling;
    if (!input.files || input.files.length === 0) {
        wrapper.classList.add('hidden');
        return;
    }
    var url = URL.createObjectURL(input.files[0]);
    wrapper.querySelector('img').src = url;
    wrapper.classList.remove('hidden');
}

document.addEventListener('DOMContentLoaded', function () {
    var form = document.querySelector('form');
    form.addEventListener('submit', async function (e) {
        e.preventDefault();
        var formData = new FormData(form);
        try {
            const url = urejanjeId ? '/prenocisce/' + urejanjeId : '/dodaj-prenocisce';
            const metoda = urejanjeId ? 'PUT' : 'POST';
            var res = await fetch(url, {
                method: metoda,
                headers: { 'Authorization': 'Bearer ' + sessionStorage.getItem('token') },
                body: formData
            });
            var data = await res.json();
            if (data.uspeh) {
                alert(urejanjeId ? 'Prenočišče je bilo uspešno posodobljeno!' : 'Prenočišče je bilo uspešno dodano!');
                window.location.href = 'profile.html';
            } else {
                alert('Napaka pri shranjevanju.');
            }
        } catch (err) {
            alert('Napaka pri povezavi s strežnikom.');
        }
    });
});

function dodajTag() {
    var input = document.getElementById('tag-input');
    var naziv = input.value.trim();
    if (!naziv) return;

    var container = document.getElementById('tagi-container');
    var hidden = document.getElementById('tagi-hidden');
    var id = 'tag-' + Date.now();

    var tag = document.createElement('div');
    tag.className = 'flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 text-slate-700 font-bold text-sm';
    tag.id = id;
    tag.innerHTML = naziv + ' <button type="button" onclick="odstraniTag(\'' + id + '\')" class="text-slate-400 hover:text-red-500 font-bold ml-1">✕</button>';
    container.appendChild(tag);

    var hiddenInput = document.createElement('input');
    hiddenInput.type = 'hidden';
    hiddenInput.name = 'tag_naziv[]';
    hiddenInput.value = naziv;
    hiddenInput.id = 'hidden-' + id;
    document.querySelector('form').appendChild(hiddenInput);

    var hiddenEmoji = document.createElement('input');
    hiddenEmoji.type = 'hidden';
    hiddenEmoji.name = 'tag_emoji[]';
    hiddenEmoji.value = '';
    hiddenEmoji.id = 'emoji-' + id;
    document.querySelector('form').appendChild(hiddenEmoji);

    input.value = '';
}

function odstraniTag(id) {
    var tag = document.getElementById(id);
    var hidden = document.getElementById('hidden-' + id);
    var emoji = document.getElementById('emoji-' + id);
    if (tag) tag.remove();
    if (hidden) hidden.remove();
    if (emoji) emoji.remove();
}

async function poisciNaslov() {
    const naslov = document.getElementById('naslov-input').value;
    if (!naslov) return;

    const odgovor = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${naslov}`,
        { method: 'GET' }
    );
    const podatki = await odgovor.json();

    if (podatki.length === 0) {
        alert('Naslova ni bilo mogoče najti. Poskusite z bolj natančnim naslovom.');
        return;
    }

    const lat = podatki[0].lat;
    const lon = podatki[0].lon;

    // Shrani koordinate v skriti inputi (zdruzi lat in lon)
    document.getElementById('koordinate').value = lat + ',' + lon;

    // Prikaži mapo
    document.getElementById('map').style.display = 'block';

    // Ustvari ali posodobi mapo
    if (window.zemljevid) {
        window.zemljevid.setView([lat, lon], 15);
        window.marker.setLatLng([lat, lon]);
    } else {
        window.zemljevid = L.map('map').setView([lat, lon], 15);
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(window.zemljevid);
        window.marker = L.marker([lat, lon]).addTo(window.zemljevid);
    }
}

function odstraniObstojecoSliko(id) {
    document.getElementById('obstojecaSlika-' + id).remove();
    var hidden = document.createElement('input');
    hidden.type = 'hidden';
    hidden.name = 'odstranjenaSlika[]';
    hidden.value = id;
    document.querySelector('form').appendChild(hidden);
    // Če ni več nobena cover, označi prvo
    setTimeout(() => {
        const prvaObs = document.querySelector('[id^="zvezda-obs-"]');
        const prvaNova = document.querySelector('[id^="zvezda-"][id^="zvezda-"]:not([id^="zvezda-obs-"])');
        if (!document.querySelector('.text-yellow-400')) {
            if (prvaObs) prvaObs.click();
            else if (prvaNova) prvaNova.click();
        }
    }, 100);
}

function oznaciCoverObstojeco(id) {
    // Pobriši vse cover oznake
    document.querySelectorAll('[id^="zvezda-obs-"]').forEach(z => {
        z.textContent = '☆';
        z.className = 'text-xl transition-transform hover:scale-125 text-slate-300';
    });
    document.querySelectorAll('[id^="cover-znak-obs-"]').forEach(z => {
        z.textContent = '';
        z.className = 'text-xs text-slate-300 px-2 py-1 rounded-full';
    });
    // Pobriši cover pri novih slikah
    document.querySelectorAll('[id^="zvezda-"]').forEach(z => {
        if (!z.id.includes('obs')) {


            z.textContent = '☆';
            z.className = 'text-xl transition-transform hover:scale-125 text-slate-300';
        }
    });

    // Pobriši napise pri novih slikah
    document.querySelectorAll('[id^="cover-znak-"]').forEach(z => {
        if (!z.id.includes('obs')) {
            z.textContent = '';
            z.className = 'text-xs text-slate-300 px-2 py-1 rounded-full';
        }
    });

    // Nastavi to sliko kot cover
    const zvezda = document.getElementById('zvezda-obs-' + id);
    const znak = document.getElementById('cover-znak-obs-' + id);
    zvezda.textContent = '★';
    zvezda.className = 'text-xl transition-transform hover:scale-125 text-yellow-400';
    znak.textContent = 'Naslovna slika';
    znak.className = 'text-xs font-bold text-teal-600 bg-teal-50 px-2 py-1 rounded-full';

    // Shrani ID obstoječe cover slike
    document.getElementById('cover-index').value = 'obs-' + id;
}


function odstraniNovoSliko(gumb) {
    var bilaCover = gumb.previousElementSibling?.previousElementSibling?.classList.contains('text-yellow-400') ||
        gumb.closest('div').querySelector('.text-yellow-400') !== null;
    gumb.closest('div').remove();

    // Če ni več nobena cover, označi prvo preostalo
    setTimeout(() => {
        if (!document.querySelector('.text-yellow-400')) {
            var prvaZvezda = document.querySelector('[id^="zvezda-"]:not([id^="zvezda-obs-"])');
            if (prvaZvezda) prvaZvezda.click();
            else {
                var prvaObsZvezda = document.querySelector('[id^="zvezda-obs-"]');
                if (prvaObsZvezda) prvaObsZvezda.click();
            }
        }
    }, 50);
}