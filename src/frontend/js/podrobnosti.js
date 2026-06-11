// Globalne spremenljivke
let map;
let destinationMarker;
let userMarker;
let routingControl;
let destinationCoords = null;
let lastnikId = null;

const API_URL = 'http://localhost:3000/api';

function slikaVUrl(s) {
    if (!s) return null;
    if (s.slika) return s.slika;
    if (s.pot_slike) return s.pot_slike;
    if (s.url) return s.url;
    return null;
}

// Parsa datum string "YYYY-MM-DD" brez timezone zamika
function parseDatum(str) {
    if (!str) return null;
    const [y, m, d] = str.split('-').map(Number);
    return new Date(y, m - 1, d);
}

// Funkcija za inicializacijo zemljevida
function inicializirajZemljevid(koordinate) {
    const coords = koordinate.split(',').map(c => parseFloat(c.trim()));
    
    if (coords.length !== 2 || isNaN(coords[0]) || isNaN(coords[1])) {
        console.error('✗ Neveljavne koordinate:', koordinate);
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
        html: '<div style="background: #2563eb; width: 40px; height: 40px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 4px solid white; box-shadow: 0 4px 6px rgba(0,0,0,0.3);"><div style="transform: rotate(45deg); color: white; font-size: 20px; text-align: center; line-height: 32px;">🏠</div></div>',
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
        console.error('✗ Zemljevid še ni inicializiran!');
        return;
    }
    
    if (!navigator.geolocation) {
        console.error('✗ Vaša naprava ne podpira geolokacije!');
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
            console.error('✗ Napaka pri pridobivanju lokacije:', error);
            const el = document.getElementById(lokacijaNapaka);
            if(el){
                el.textContent = '✗ Ne morem pridobiti vaše lokacije. Prosimo omogočite dostop do lokacije v nastavitvah brskalnika.';
                el.classList.remove('hidden');
            }
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
        preveriPriljubljeno(prenocisceId);
        naloziSporocila(prenocisceId);
        preveriUpravicenostOcene(prenocisceId);  
        _prenocisceId = prenocisceId;
        
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
    
    // Shrani ID lastnika prenočišča
    lastnikId = prenocisce.TK_uporabnik;

    // Osnovni podatki
    setElementText('tipPrenocisca', `🏠 ${prenocisce.tip_prenocisca || 'Neznano'}`);
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
    if (prenocisce.bazen) {
        document.getElementById('bazenCard').style.display = 'block';
    }
    if (prenocisce.parking) {
        document.getElementById('parkingCard').style.display = 'block';
    }
    if (prenocisce.zajtrk) {
        document.getElementById('zajtrkCard').style.display = 'block';
    }
    if (prenocisce.razgled) {
        document.getElementById('razgledCard').style.display = 'block';
    }
    if (prenocisce.ljubljencki) {
        document.getElementById('ljubljenckiCard').style.display = 'block';
    }
    if (prenocisce.trajnostno) {
        document.getElementById('trajnostnoCard').style.display = 'block';
    }
    //tagi
    prikaziTage(prenocisce.tagi);
    //doživetja
    prikaziDozivetja(dozivetja || []).catch(console.error);
    //komentarji
    prikaziKomentarje(komentarji || []);
    //shrani podatke za rezervacijski modal
    _rezervacijaData.naziv     = prenocisce.naziv || '';
    _rezervacijaData.cenaNaNoc = parseFloat(prenocisce.cena_na_noc) || 0;
    _rezervacijaData.maxGostov = parseInt(prenocisce.max_gostov) || 10;
}

// Hero carousel state
let _heroCarouselIndex = 0;
let _heroCarouselUrls = [];
 
// Prikaz hero background slike + carousel vseh slik prenočišča
function prikaziHeroSliko(slike) {
    // filtriramo samo slike prenočišča
    const prenocisceSlike = slike.filter(
        s => s.TK_prenocisce !== undefined && s.TK_prenocisce !== null
    );
    if (prenocisceSlike.length === 0) return;
 
    // ── 1. cover slika kot ozadje hero sekcije ───────────────
    const coverSlika = prenocisceSlike.find(s => s.cover === true || s.cover === 1);
    const heroSection = document.getElementById('heroSection');
    const heroDekor = document.getElementById('heroDekor');
 
    if (coverSlika) {
        const url = slikaVUrl(coverSlika);
        if (url && heroSection) {
            heroSection.style.backgroundImage = `linear-gradient(to bottom right, rgba(15,23,42,0.72), rgba(30,58,138,0.65), rgba(17,94,89,0.55)), url('${url}')`;
            heroSection.style.backgroundSize = 'cover';
            heroSection.style.backgroundPosition = 'center';
        }
        if (heroDekor) heroDekor.style.display = 'none';
    }
 
    // ── 2. VSE slike v carousel (cover prva, potem ostale) ──────
    const vseSlike = [
        ...(coverSlika ? [coverSlika] : []),
        ...prenocisceSlike.filter(s => s.cover !== true && s.cover !== 1)
    ];
    if (vseSlike.length === 0) return;
 
    const wrap = document.getElementById('heroGalerijaWrap');
    const track = document.getElementById('heroCarouselTrack');
    const dotsContainer = document.getElementById('heroCarouselDots');
    if (!wrap || !track || !dotsContainer) return;
 
    _heroCarouselUrls = vseSlike.map(s => slikaVUrl(s)).filter(Boolean);
    _heroCarouselIndex = 0;
 
    track.innerHTML = '';
    dotsContainer.innerHTML = '';
 
    // track: relativno, polna višina
    track.style.cssText = 'position:relative; width:100%; height:100%;';
 
    _heroCarouselUrls.forEach((url, i) => {
        const slide = document.createElement('div');
        slide.style.cssText = 'position:absolute; inset:0; transition:opacity 0.4s ease;';
        slide.style.opacity = i === 0 ? '1' : '0';
        slide.style.pointerEvents = i === 0 ? 'auto' : 'none';
 
        const img = document.createElement('img');
        img.src = url;
        img.alt = `Slika ${i + 1}`;
        img.style.cssText = 'width:100%; height:100%; object-fit:cover; display:block;';
        img.onerror = () => { slide.style.display = 'none'; };
        slide.appendChild(img);
        track.appendChild(slide);
 
        const dot = document.createElement('button');
        dot.style.cssText = `width:8px; height:8px; border-radius:50%; border:none; cursor:pointer; transition:all 0.2s; background:${i === 0 ? 'white' : 'rgba(255,255,255,0.4)'};`;
        dot.onclick = () => heroCarouselGoTo(i);
        dotsContainer.appendChild(dot);
    });
 
    wrap.classList.remove('hidden');
    _heroCarouselUpdate();
}
 
function _heroCarouselUpdate() {
    const slides = document.querySelectorAll('#heroCarouselTrack > div');
    const dots = document.querySelectorAll('#heroCarouselDots button');
    slides.forEach((s, i) => {
        const active = i === _heroCarouselIndex;
        s.style.opacity = active ? '1' : '0';
        s.style.pointerEvents = active ? 'auto' : 'none';
    });
    dots.forEach((d, i) => {
        d.style.background = i === _heroCarouselIndex ? 'white' : 'rgba(255,255,255,0.4)';
        d.style.transform = i === _heroCarouselIndex ? 'scale(1.3)' : 'scale(1)';
    });
}
 
function heroCarouselNext() {
    if (_heroCarouselUrls.length === 0) return;
    _heroCarouselIndex = (_heroCarouselIndex + 1) % _heroCarouselUrls.length;
    _heroCarouselUpdate();
}
 
function heroCarouselPrev() {
    if (_heroCarouselUrls.length === 0) return;
    _heroCarouselIndex = (_heroCarouselIndex - 1 + _heroCarouselUrls.length) % _heroCarouselUrls.length;
    _heroCarouselUpdate();
}
 
function heroCarouselGoTo(i) {
    _heroCarouselIndex = i;
    _heroCarouselUpdate();
}
 
// Ohrani prazne stub funkcije za nazaj-kompatibilnost (carousel ni več v HTML)
function premakniCarousel() {}
function postaviCarousel() {}
function osveziCarousel() {}

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
                <span class="font-semibold text-slate-800">${tag.naziv || 'Posebnost'}</span>
            `;
            
            container.appendChild(tagElement);
        });
        
    } catch (error) {
        console.error('❌ Napaka pri parsanju tagov:', error);
        container.innerHTML = '<p class="text-slate-400">Napaka pri nalaganju posebnosti</p>';
    }
}

//prikaz doživetij
async function prikaziDozivetja(dozivetja) {
    const container = document.getElementById('dozivetjaContainer');
    if (!container) return;
    container.innerHTML = '';

    if (!dozivetja || dozivetja.length === 0) {
        document.getElementById('dozivetjaSection').style.display = 'none';
        return;
    }
    document.getElementById('dozivetjaSection').style.display = 'block';

    //za vsako doživetje pridobi slike iz baze in zgradi carousel
    for (const dozivetje of dozivetja) {  //for...of namesto forEach
        let carouselHtml;
        try {
            const slikeRes = await fetch(`/api/dozivetje/${dozivetje.ID_dozivetje}/slike`);
            const slike = await slikeRes.json();
            carouselHtml = slike.length > 0
                ? `<div class="relative overflow-hidden rounded-2xl h-48 mb-6" data-carousel>
                     ${slike.map((s, i) => `
                       <img src="/api/slika-dozivetja-id/${s.ID_slika}"
                            class="absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${i === 0 ? 'opacity-100' : 'opacity-0'}"
                            data-idx="${i}" />
                     `).join('')}
                     ${slike.length > 1 ? `
                       <button onclick="prevSlika(this)" class="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 font-bold text-slate-700 hover:bg-white transition flex items-center justify-center shadow">‹</button>
                       <button onclick="nextSlika(this)" class="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 font-bold text-slate-700 hover:bg-white transition flex items-center justify-center shadow">›</button>
                     ` : ''}
                   </div>`
                : `<div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-100 to-teal-100 flex items-center justify-center text-3xl mb-6">🎭</div>`; //ni slik, prikaže privzeti emoji
        } catch {
            carouselHtml = `<div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-100 to-teal-100 flex items-center justify-center text-3xl mb-6">🎭</div>`; //če fetch ne uspe pokaže emoji, namesto da stran ne dela
        }

        const card = document.createElement('div');
        card.className = 'group relative overflow-hidden rounded-3xl bg-white border-2 border-slate-200 transition-all hover:border-blue-500 hover:shadow-2xl hover:-translate-y-2';
        card.innerHTML = `
            ${carouselHtml}
            <div class="p-8 pt-0">
                <h3 class="text-2xl font-bold text-slate-900 mb-3">${dozivetje.naziv || 'Neznano doživetje'}</h3>
                <p class="text-slate-600 mb-6 leading-relaxed">${dozivetje.opis || 'Ni opisa'}</p>
                <div class="flex items-center justify-between">
                    <div class="text-3xl font-extrabold text-blue-600">${parseFloat(dozivetje.doplacilo || 0).toFixed(2)} €</div>
                    <button class="px-6 py-3 rounded-full bg-slate-900 text-white font-bold hover:bg-blue-600 transition-all">Dodaj</button>
                </div>
            </div>
        `;
        container.appendChild(card);
    }
}

//funkciji za carousel slik
//premakne na prejšnjo sliko
function prevSlika(btn) {
    const carousel = btn.closest('[data-carousel]');
    const imgs = carousel.querySelectorAll('img');
    const trenutni = [...imgs].findIndex(img => img.classList.contains('opacity-100'));
    imgs[trenutni].classList.replace('opacity-100', 'opacity-0');
    imgs[(trenutni - 1 + imgs.length) % imgs.length].classList.replace('opacity-0', 'opacity-100');
}
//premakne na naslednjo sliko
function nextSlika(btn) {
    const carousel = btn.closest('[data-carousel]');
    const imgs = carousel.querySelectorAll('img');
    const trenutni = [...imgs].findIndex(img => img.classList.contains('opacity-100'));
    imgs[trenutni].classList.replace('opacity-100', 'opacity-0');
    imgs[(trenutni + 1) % imgs.length].classList.replace('opacity-0', 'opacity-100');
}

//prikaz komentarjev
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
                <div class="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center text-white font-bold text-xl overflow-hidden">
                    <img src="/api/auth/profilna-slika/${komentar.TK_uporabnik}" 
                         onerror="this.style.display='none'; this.nextElementSibling.style.display='flex'"
                         class="w-full h-full object-cover" />
                    <span style="display:none" class="w-full h-full flex items-center justify-center">${inicialiIme}${inicialiPriimek}</span>
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

let _rezervacijaData = {
    naziv: '',
    cenaNaNoc: 0,
    maxGostov: 10
};

let _zasedenObdobja = [];

// ---- MINI KALENDAR ----
let _kalendarDatum = new Date();

function izrisiKalendar() {
    const leto = _kalendarDatum.getFullYear();
    const mesec = _kalendarDatum.getMonth();

    const mesecIme = new Date(leto, mesec, 1).toLocaleDateString('sl-SI', { month: 'long', year: 'numeric' });
    const el = document.getElementById('kalendarNaslov');
    if (el) el.textContent = mesecIme.charAt(0).toUpperCase() + mesecIme.slice(1);

    const container = document.getElementById('kalendarDni');
    if (!container) return;
    container.innerHTML = '';

    const prihodVal = document.getElementById('datumPrihod')?.value;
    const odhodVal  = document.getElementById('datumOdhod')?.value;

    // Začni od ponedeljka
    const prvDan = new Date(leto, mesec, 1);
    let zacetek = prvDan.getDay(); // 0=ned, 1=pon...
    zacetek = zacetek === 0 ? 6 : zacetek - 1;

    const danes = new Date(); danes.setHours(0,0,0,0);

    // Prazne celice za poravnavo
    for (let i = 0; i < zacetek; i++) {
        const p = document.createElement('div');
        container.appendChild(p);
    }

    const dniVMesecu = new Date(leto, mesec + 1, 0).getDate();
    for (let d = 1; d <= dniVMesecu; d++) {
        // Ustvarimo datum lokalno (brez UTC zamika)
        const datum = new Date(leto, mesec, d);
        const datumStr = `${leto}-${String(mesec + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const zaseden = jeZaseden(datumStr);
        const preteklo = datum < danes;
        const jeIzbranPrihod = datumStr === prihodVal;
        const jeIzbranOdhod  = datumStr === odhodVal;

        let vObdobju = false;
        if (prihodVal && odhodVal) {
            const od = parseDatum(prihodVal);
            const do_ = parseDatum(odhodVal);
            vObdobju = datum > od && datum < do_;
        }

        const cell = document.createElement('div');
        cell.textContent = d;
        cell.className = 'text-center text-xs rounded-md py-1 cursor-pointer transition-all font-medium ';

        if (preteklo) {
            cell.className += 'text-slate-300 cursor-default';
        } else if (zaseden) {
            cell.className += 'bg-red-400 text-white font-bold cursor-not-allowed';
            cell.title = 'Zasedeno';
        } else if (jeIzbranPrihod || jeIzbranOdhod) {
            cell.className += 'bg-blue-600 text-white font-bold shadow-sm';
            cell.title = jeIzbranPrihod ? 'Prihod' : 'Odhod';
        } else if (vObdobju) {
            cell.className += 'bg-blue-100 text-blue-800';
        } else {
            cell.className += 'hover:bg-slate-200 text-slate-700';
            cell.onclick = () => izberiDatum(datumStr);
        }

        container.appendChild(cell);
    }
}

function izberiDatum(datumStr) {
    const prihod = document.getElementById('datumPrihod');
    const odhod  = document.getElementById('datumOdhod');
    if (!prihod || !odhod) return;

    if (!prihod.value || (prihod.value && odhod.value)) {
        prihod.value = datumStr;
        odhod.value = '';
    } else {
        if (datumStr <= prihod.value) {
            prihod.value = datumStr;
            odhod.value = '';
        } else {
            odhod.value = datumStr;
            onOdhodChange();
        }
    }
    posodobiCeno();
    izrisiKalendar();
}

function kalendarPrejsniMesec() {
    _kalendarDatum.setMonth(_kalendarDatum.getMonth() - 1);
    izrisiKalendar();
}

function kalendarNaslednjMesec() {
    _kalendarDatum.setMonth(_kalendarDatum.getMonth() + 1);
    izrisiKalendar();
}
// ---- KONEC MINI KALENDAR ----

function jeZaseden(datumStr) {
    const d = parseDatum(datumStr);
    return _zasedenObdobja.some(({ od, do_ }) => d >= od && d < do_);
}

function prvProstDatum(odStr) {
    let d = parseDatum(odStr);
    for (let i = 0; i < 365; i++) {
        const str = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
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
            od:  parseDatum(r.datum_od.split('T')[0]),
            do_: parseDatum(r.datum_do.split('T')[0])
        }));
    } catch (e) {
        _zasedenObdobja = [];
    }
}

async function odpriRezervacijo() {
    const modal = document.getElementById('rezervacijaModal');
    const panel = document.getElementById('rezervacijaPanel');
    if (!modal || !panel) return;

    const nazEl = document.getElementById('modalNaziv');
    if (nazEl) nazEl.textContent = _rezervacijaData.naziv || document.getElementById('nazivPrenocisca')?.textContent || '';

    const mgEl = document.getElementById('maxGostovInfo');
    if (mgEl) mgEl.textContent = `(max ${_rezervacijaData.maxGostov})`;

    document.getElementById('modalNapaka')?.classList.add('hidden');
    document.getElementById('modalUspeh')?.classList.add('hidden');

    modal.style.display = 'flex';
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            panel.classList.remove('scale-95');
            panel.classList.add('scale-100');
        });
    });
    document.body.style.overflow = 'hidden';

    const urlParams = new URLSearchParams(window.location.search);
    const prenocisceId = urlParams.get('id') || 2;
    await naloziZasedenost(prenocisceId);

    const danes = new Date();
    const danesStr = `${danes.getFullYear()}-${String(danes.getMonth() + 1).padStart(2, '0')}-${String(danes.getDate()).padStart(2, '0')}`;
    const prihodStr = prvProstDatum(danesStr);

    const naslednji = parseDatum(prihodStr);
    naslednji.setDate(naslednji.getDate() + 1);
    const naslednjStr = `${naslednji.getFullYear()}-${String(naslednji.getMonth() + 1).padStart(2, '0')}-${String(naslednji.getDate()).padStart(2, '0')}`;
    const odhodStr = prvProstDatum(naslednjStr);

    const prihod = document.getElementById('datumPrihod');
    const odhod  = document.getElementById('datumOdhod');
    if (prihod) { prihod.min = danesStr; prihod.value = prihodStr; }
    if (odhod)  { odhod.min  = danesStr; odhod.value  = odhodStr; }

    prihod?.addEventListener('change', onPrihodChange);
    odhod?.addEventListener('change', onOdhodChange);

    _kalendarDatum = new Date();
    izrisiKalendar();
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
    izrisiKalendar();
}

function onOdhodChange() {
    const el = document.getElementById('datumOdhod');
    const napaka = document.getElementById('modalNapaka');
    const prihodVal = document.getElementById('datumPrihod')?.value;

    if (prihodVal && el.value) {
        const od = parseDatum(prihodVal);
        const do_ = parseDatum(el.value);
        let zaseden = false;
        let d = parseDatum(prihodVal);
        while (d < do_) {
            const dStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            if (jeZaseden(dStr)) { zaseden = true; break; }
            d.setDate(d.getDate() + 1);
        }
        if (zaseden) {
            napaka.textContent = '⚠️ Izbrano obdobje vsebuje zasedene datume. Izberite drug datum odhoda.';
            napaka.classList.remove('hidden');
            el.value = '';
            izrisiKalendar();
            return;
        }
    }
    napaka.classList.add('hidden');
    posodobiCeno();
    izrisiKalendar();
}

function zapriRezervacijo() {
    const modal = document.getElementById('rezervacijaModal');
    const panel = document.getElementById('rezervacijaPanel');
    if (!modal || !panel) return;

    panel.classList.remove('scale-100');
    panel.classList.add('scale-95');

    setTimeout(() => { modal.style.display = 'none'; }, 200);
    document.body.style.overflow = '';

    document.getElementById('datumPrihod')?.removeEventListener('change', onPrihodChange);
    document.getElementById('datumOdhod')?.removeEventListener('change', onOdhodChange);
}

function spremembaGostov(delta) {
    const el = document.getElementById('steviloGostov');
    if (!el) return;
    let val = parseInt(el.textContent) + delta;
    val = Math.max(1, Math.min(val, _rezervacijaData.maxGostov || 10));
    el.textContent = val;

    el.classList.add('scale-125', 'text-blue-600');
    setTimeout(() => el.classList.remove('scale-125', 'text-blue-600'), 200);
}

function posodobiCeno() {
    const prihodVal = document.getElementById('datumPrihod')?.value;
    const odhodVal  = document.getElementById('datumOdhod')?.value;
    const summary   = document.getElementById('cenaSummary');

    if (!prihodVal || !odhodVal) { if (summary) summary.style.display = 'none'; return; }

    const p = parseDatum(prihodVal);
    const o = parseDatum(odhodVal);
    const noci = Math.round((o - p) / 86400000);

    if (noci <= 0) {
        const novOdhod = parseDatum(prihodVal);
        novOdhod.setDate(novOdhod.getDate() + 1);
        const novOdhodStr = `${novOdhod.getFullYear()}-${String(novOdhod.getMonth() + 1).padStart(2, '0')}-${String(novOdhod.getDate()).padStart(2, '0')}`;
        const odEl = document.getElementById('datumOdhod');
        if (odEl) odEl.value = novOdhodStr;
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

    if (!prihodVal || !odhodVal) {
        if (napaka) { napaka.textContent = '❌ Prosimo izberite datume prihoda in odhoda.'; napaka.classList.remove('hidden'); }
        return;
    }
    if (parseDatum(odhodVal) <= parseDatum(prihodVal)) {
        if (napaka) { napaka.textContent = '❌ Datum odhoda mora biti po datumu prihoda.'; napaka.classList.remove('hidden'); }
        return;
    }

    const token = sessionStorage.getItem('token');
    if (!token) {
        if (napaka) { napaka.textContent = '❌ Za rezervacijo se morate prijaviti.'; napaka.classList.remove('hidden'); }
        setTimeout(() => { window.location.href = 'login.html'; }, 1500);
        return;
    }

    if (btn) btn.disabled = true;
    if (btnTxt) btnTxt.textContent = 'Pošiljam rezervacijo...';

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
            const rezervacijaData = await response.json().catch(() => ({}));
            const noci = Math.round((parseDatum(odhodVal) - parseDatum(prihodVal)) / 86400000);
            const skupaj = noci * _rezervacijaData.cenaNaNoc;

            const params = new URLSearchParams({
                naziv: _rezervacijaData.naziv,
                prihod: prihodVal,
                odhod: odhodVal,
                gostov: gostov,
                noci: noci,
                cena: skupaj.toFixed(2),
                prenocisceId: prenocisceId
            });

            window.location.href = `potrditev_rezervacije.html?${params.toString()}`;
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

document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') zapriRezervacijo();
});

// ===================== VPRAŠANJA IN ODGOVORI =====================

async function naloziSporocila(prenocisceId) {
    try {
        const res = await fetch(`${API_URL}/sporocila/${prenocisceId}`);
        const sporocila = await res.json();
        prikaziSporocila(sporocila);
    } catch (err) {
        console.error('Napaka pri nalaganju sporočil:', err);
    }
}

function prikaziSporocila(sporocila) {
    const container = document.getElementById('sporosilaContainer');
    if (!container) return;

    const token = sessionStorage.getItem('token');
    const payload = token ? JSON.parse(atob(token.split('.')[1])) : null;
    const jeAdmin = payload?.je_admin || false;
    const trenutniUserId = payload?.id || null;

    document.getElementById('vprasanjeObrazec').classList.toggle('hidden', !token);
    document.getElementById('prijavaZaVprasanje').classList.toggle('hidden', !!token);

    if (!sporocila || sporocila.length === 0) {
        container.innerHTML = '<p class="text-center text-slate-400">Še ni vprašanj. Bodite prvi!</p>';
        return;
    }

    container.innerHTML = '';

    sporocila.forEach(s => {
        const card = document.createElement('div');
        card.className = 'bg-white rounded-3xl border border-slate-200 shadow-sm p-8';

        const datum = new Date(s.datum_sporocila).toLocaleDateString('sl-SI');
        const inicialiIme = (s.ime_uporabnika || 'U').charAt(0);
        const inicialiPriimek = (s.priimek_uporabnika || '').charAt(0);

        // Pokaži textarea če je admin ALI če je lastnik tega prenočišča
        const lahkoOdgovori = jeAdmin || (trenutniUserId !== null && trenutniUserId === lastnikId);
        
        let odgovoril = '';
        if (jeAdmin) {
            odgovoril = 'Admin';
        } else if (trenutniUserId !== null && trenutniUserId === lastnikId) {
            odgovoril = 'Lastnik';
        }

        card.innerHTML = `
            <div class="flex items-center gap-3 mb-4">
                <div class="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center text-white font-bold overflow-hidden">
                    <img src="/api/auth/profilna-slika/${s.TK_uporabnik}" 
                         onerror="this.style.display='none'; this.nextElementSibling.style.display='flex'"
                         class="w-full h-full object-cover" />
                    <span style="display:none" class="w-full h-full flex items-center justify-center">${inicialiIme}${inicialiPriimek}</span>
                </div>
                <div>
                    <div class="font-bold text-slate-900">${s.ime_uporabnika || 'Neznano'} ${s.priimek_uporabnika || ''}</div>
                    <div class="text-xs text-slate-400">${datum}</div>
                </div>
            </div>
            <p class="text-slate-800 font-semibold mb-4">❓ ${s.vprasanje}</p>
            ${s.odgovor ? `
                <div class="bg-teal-50 border border-teal-200 rounded-2xl p-4">
                    <p class="text-xs font-bold text-teal-600 uppercase tracking-widest mb-1">✅ Odgovor ${odgovoril}</p>
                    <p class="text-slate-700">${s.odgovor}</p>
                </div>
            ` : `
                <p class="text-slate-400 text-sm italic">Še ni odgovora.</p>
                ${lahkoOdgovori ? `
                    <div class="mt-4">
                        <textarea id="odgovor_${s.ID_sporocila}" rows="2" placeholder="Vnesite odgovor..." class="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 font-semibold outline-none focus:border-teal-400 focus:bg-white transition resize-none mb-2"></textarea>
                        <button onclick="posljiOdgovor(${s.ID_sporocila})" class="px-6 py-2.5 rounded-full bg-teal-500 text-white font-bold hover:bg-teal-600 transition text-sm">
                            Pošlji odgovor
                        </button>
                    </div>
                ` : ''}
            `}
        `;

        container.appendChild(card);
    });
}

async function posljiVprasanje() {
    const vprasanje = document.getElementById('novoVprasanje').value.trim();
    const napaka = document.getElementById('vprasanjeNapaka');
    napaka.classList.add('hidden');

    if (!vprasanje) {
        napaka.textContent = 'Prosimo vnesite vprašanje.';
        napaka.classList.remove('hidden');
        return;
    }

    const token = sessionStorage.getItem('token');
    const urlParams = new URLSearchParams(window.location.search);
    const prenocisceId = urlParams.get('id') || 2;

    try {
        const res = await fetch(`${API_URL}/sporocila`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify({ vprasanje, TK_prenocisce: prenocisceId })
        });

        if (res.ok) {
            document.getElementById('novoVprasanje').value = '';
            naloziSporocila(prenocisceId);
        } else {
            const err = await res.json();
            napaka.textContent = err.napaka || 'Napaka pri pošiljanju.';
            napaka.classList.remove('hidden');
        }
    } catch (err) {
        napaka.textContent = 'Napaka pri povezavi s strežnikom.';
        napaka.classList.remove('hidden');
    }
}

async function posljiOdgovor(sporosiloId) {
    const odgovor = document.getElementById(`odgovor_${sporosiloId}`).value.trim();
    if (!odgovor) return;

    const token = sessionStorage.getItem('token');

    try {
        const res = await fetch(`${API_URL}/sporocila/${sporosiloId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify({ odgovor })
        });

        if (res.ok) {
            const urlParams = new URLSearchParams(window.location.search);
            naloziSporocila(urlParams.get('id') || 2);
        }
    } catch (err) {
        console.error('Napaka pri pošiljanju odgovora:', err);
    }
}

// PRILJUBLJENO 

// hrani trenutno stanje priljubljenega prenočišča
let jePriljubljeno = false;

// preveri ali je trenutno prenočišče dodano med priljubljene in nastavi prikaz srčka
async function preveriPriljubljeno(prenocisceId) {
    const token = sessionStorage.getItem('token');
    if (!token) return;
    try {
        const res = await fetch(`${API_URL}/priljubljeno/${prenocisceId}`, {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        const data = await res.json();
        jePriljubljeno = data.priljubljeno;
        document.getElementById('btnPriljubljeno').textContent = jePriljubljeno ? '♥' : '♡';
        document.getElementById('btnPriljubljeno').classList.toggle('active', jePriljubljeno);
    } catch (err) {}
}

// doda ali odstrani prenočišče iz priljubljenih ob kliku na srček
async function togglePriljubljeno() {
    const token = sessionStorage.getItem('token');
     // preusmeri na prijavo če uporabnik ni prijavljen
    if (!token) { window.location.href = 'login.html'; return; }
    const prenocisceId = new URLSearchParams(window.location.search).get('id') || 2;
    try {
        const res = await fetch(`${API_URL}/priljubljeno/${prenocisceId}`, {
            method: 'POST',
            headers: { 'Authorization': 'Bearer ' + token }
        });
        const data = await res.json();
        //posodobi stanje priljubljenega prenočišča
        jePriljubljeno = data.priljubljeno;
          //spremeni prikaz srčka glede na stanje
        document.getElementById('btnPriljubljeno').textContent = jePriljubljeno ? '♥' : '♡';
        document.getElementById('btnPriljubljeno').classList.toggle('active', jePriljubljeno);
    } catch (err) {}
}

//OCENA/KOMENTAR
let _prenocisceId = null;
 
//nastavi interaktivne zvezdice za eno skupino
function nastaviZvezdice(skupinaId) {
    const zvezdice = document.querySelectorAll(`[data-skupina="${skupinaId}"]`);
    const hiddenInput = document.getElementById(`ocena_${skupinaId}`);
    if (!zvezdice.length || !hiddenInput) return;
 
    zvezdice.forEach(z => {
        z.addEventListener('mouseenter', () => {
            const val = parseInt(z.dataset.vrednost);
            zvezdice.forEach(s => {
                s.textContent = parseInt(s.dataset.vrednost) <= val ? '⭐' : '☆';
                s.style.transform = parseInt(s.dataset.vrednost) === val ? 'scale(1.25)' : 'scale(1)';
            });
        });
        z.addEventListener('mouseleave', () => {
            const izbrana = parseInt(hiddenInput.value) || 0;
            zvezdice.forEach(s => {
                s.textContent = parseInt(s.dataset.vrednost) <= izbrana ? '⭐' : '☆';
                s.style.transform = 'scale(1)';
            });
        });
        z.addEventListener('click', () => {
            hiddenInput.value = z.dataset.vrednost;
            const val = parseInt(z.dataset.vrednost);
            zvezdice.forEach(s => {
                s.textContent = parseInt(s.dataset.vrednost) <= val ? '⭐' : '☆';
                s.style.transform = 'scale(1)';
            });
        });
    });
}
 
async function preveriUpravicenostOcene(prenocisceId) {
    const sekcija = document.getElementById('ocenaSekcija');
    const ocenaSekcijaWrapper = document.getElementById('ocenaSekcijaWrapper');
    const komentarjiSekcija = document.getElementById('komentarjiSekcija');

    if (!sekcija) return;
 
    const token = sessionStorage.getItem('token');
 
    //skrij vse bloke preden preverimo, eden se bo prikazal glede na razultat
    ['ocenaNiPrijavljen', 'ocenaObrazec', 'ocenaZeOddana', 'ocenaNiRezervacije'].forEach(id => {
        document.getElementById(id)?.classList.add('hidden');
    });
 
    //uporabnik ni prijavljen - skrij vse sekcije z ocenami
    if (!token) {
        return;
    }
 
    try {
        const res = await fetch(`/api/komentar/upravicen/${prenocisceId}`, {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        const data = await res.json();
 
        if (data.jeLastnik) { //lastnik ne ocenjuje svojega prenočišča (sekcija ostane skrita)
            return;
        } else if (data.jeZeKomentiral) { //uporabnik lahko komentira le enkrat, prikaže mu zahvalo
            document.getElementById('ocenaZeOddana')?.classList.remove('hidden');
            sekcija.classList.remove('hidden');
            if (ocenaSekcijaWrapper) ocenaSekcijaWrapper.style.display = 'block';
            if (komentarjiSekcija) komentarjiSekcija.style.display = 'block';
        } else if (!data.jeRezerviral) { //uporabnik ni rezerviral (sekcija ostane skrita)
            return;
        } else { //ima pretečeno rezervacijo in še ni komentiral - prikaže mu obrazec
            document.getElementById('ocenaObrazec')?.classList.remove('hidden');
            ['splosna', 'udobje', 'unikatnost', 'lokacija', 'cenovna_ugodnost', 'dozivetje'].forEach(nastaviZvezdice);
            sekcija.classList.remove('hidden');
            if (ocenaSekcijaWrapper) ocenaSekcijaWrapper.style.display = 'block';
            if (komentarjiSekcija) komentarjiSekcija.style.display = 'block';
        }
    } catch (err) {
        console.error('Napaka pri preverjanju upravičenosti:', err);
    }
}
 
async function oddajOceno() {
    const token = sessionStorage.getItem('token');
    const napaka = document.getElementById('ocenaNapaka');
    const btn = document.getElementById('btnOddajOceno');
    if (napaka) napaka.classList.add('hidden');
 
    //splošna ocena je edino obvezno polje
    const ocena_splosna = document.getElementById('ocena_splosna')?.value || '0';
    if (ocena_splosna === '0') {
        if (napaka) {
            napaka.textContent = 'Prosimo izberite splošno oceno.';
            napaka.classList.remove('hidden');
        }
        return;
    }
 
    //zberi vse ocene in komentar v en objekt za POST
    const telo = {
        TK_prenocisce: _prenocisceId, //ID prenočišča shranjen ob nalaganju strani
        komentar: document.getElementById('ocenaKomentar')?.value?.trim() || null,
        ocena_splosna,
        ocena_udobje: document.getElementById('ocena_udobje')?.value || 0,
        ocena_unikatnost: document.getElementById('ocena_unikatnost')?.value || 0,
        ocena_lokacija: document.getElementById('ocena_lokacija')?.value || 0,
        ocena_cenovna_ugodnost: document.getElementById('ocena_cenovna_ugodnost')?.value || 0,
        ocena_dozivetje: document.getElementById('ocena_dozivetje')?.value || 0
    };
 
    if (btn) { btn.disabled = true; btn.textContent = 'Pošiljam...'; } //onemogoči gumb med pošiljanjem, da ne more dvakrat klikniti
 
    try {
        const res = await fetch('/api/komentar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
            body: JSON.stringify(telo)
        });
        const r = await res.json();
 
        if (res.ok) {
            //skrij obrazec, pokazi zahvalo
            document.getElementById('ocenaObrazec')?.classList.add('hidden');
            document.getElementById('ocenaZeOddana')?.classList.remove('hidden');
            //osveži seznam komentarjev in povprečno oceno brez ponovnega nalaganja strani
            const resp = await fetch(`${API_URL}/prenocisce/${_prenocisceId}`);
            const freshData = await resp.json();
            prikaziKomentarje(freshData.komentarji || []);
            if (freshData.povprecnaOcena) {
                setElementText('povprecnaOcena', freshData.povprecnaOcena);
                setElementText('povprecnaOcenaCard', freshData.povprecnaOcena);
            }
        } else {
            if (napaka) { napaka.textContent = r.napaka || 'Napaka pri oddaji ocene.'; napaka.classList.remove('hidden'); }
            if (btn) { btn.disabled = false; btn.textContent = 'Oddaj oceno'; }
        }
    } catch {
        if (napaka) { napaka.textContent = 'Napaka pri povezavi s strežnikom.'; napaka.classList.remove('hidden'); }
        if (btn) { btn.disabled = false; btn.textContent = 'Oddaj oceno'; }
    }
}