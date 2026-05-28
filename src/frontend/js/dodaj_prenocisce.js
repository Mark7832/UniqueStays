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
    });
}

function prikaziSlike(input) {
    if (!input) return;
    var seznam = document.getElementById('slike-seznam');
    seznam.innerHTML = '';

    if (!input.files || input.files.length === 0) return;

    document.getElementById('cover-index').value = '0';

    for (var i = 0; i < input.files.length; i++) {
        var file = input.files[i];
        var url = URL.createObjectURL(file);
        var je_cover = (i === 0);

        var vrstica = document.createElement('div');
        vrstica.className = 'flex items-center gap-4 p-3 rounded-2xl border bg-slate-50 ' + (je_cover ? 'border-teal-400' : 'border-slate-200');
        vrstica.id = 'slika-vrstica-' + i;

        vrstica.innerHTML =
            '<img src="' + url + '" class="w-16 h-12 object-cover rounded-xl flex-shrink-0" />' +
            '<span class="flex-1 text-sm font-semibold text-slate-600 truncate">' + file.name + '</span>' +
            '<button type="button" onclick="oznaCiCover(' + i + ')" id="zvezda-' + i + '" class="text-xl transition-transform hover:scale-125 ' + (je_cover ? 'text-yellow-400' : 'text-slate-300') + '" title="Nastavi kot naslovno sliko">' +
            (je_cover ? '★' : '☆') +
            '</button>' +
            (je_cover ? '<span class="text-xs font-bold text-teal-600 bg-teal-50 px-2 py-1 rounded-full" id="cover-znak-' + i + '">Naslovna slika</span>' : '<span class="text-xs text-slate-300 px-2 py-1 rounded-full" id="cover-znak-' + i + '"></span>');

        seznam.appendChild(vrstica);
    }
}

function oznaCiCover(index) {
    var input = document.getElementById('slike-input');
    var skupaj = input.files ? input.files.length : 0;

    document.getElementById('cover-index').value = index;

    for (var i = 0; i < skupaj; i++) {
        var je_ta = (i === index);
        var vrstica = document.getElementById('slika-vrstica-' + i);
        var zvezda = document.getElementById('zvezda-' + i);
        var znak = document.getElementById('cover-znak-' + i);

        if (vrstica) vrstica.className = 'flex items-center gap-4 p-3 rounded-2xl border bg-slate-50 ' + (je_ta ? 'border-teal-400' : 'border-slate-200');
        if (zvezda) {
            zvezda.textContent = je_ta ? '★' : '☆';
            zvezda.className = 'text-xl transition-transform hover:scale-125 ' + (je_ta ? 'text-yellow-400' : 'text-slate-300');
        }
        if (znak) {
            znak.textContent = je_ta ? 'Naslovna slika' : '';
            znak.className = je_ta ? 'text-xs font-bold text-teal-600 bg-teal-50 px-2 py-1 rounded-full' : 'text-xs text-slate-300 px-2 py-1 rounded-full';
        }
    }
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
                window.location.href = 'index.html';
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