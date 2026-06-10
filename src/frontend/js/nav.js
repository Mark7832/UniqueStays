const uporabnik = sessionStorage.getItem('uporabnik');
const token = sessionStorage.getItem('token');

const prijavaNaGumb = document.getElementById('btnPrijava');
const registracijaGumb = document.getElementById('btnRegistracija');
const odjavaGumb = document.getElementById('btnOdjava');
const imeUporabnika = document.getElementById('imeUporabnika');

if (token && uporabnik) {
    const podatki = JSON.parse(uporabnik);
    if (prijavaNaGumb) prijavaNaGumb.classList.add('hidden');
    if (registracijaGumb) registracijaGumb.classList.add('hidden');
    if (odjavaGumb) odjavaGumb.classList.remove('hidden');
    if (imeUporabnika) {
    imeUporabnika.textContent = 'Moj profil';
    imeUporabnika.className = 'px-5 py-2.5 rounded-full bg-gradient-to-r from-teal-500 to-blue-600 text-white font-bold hover:bg-blue-600 transition-all duration-200 hover:-translate-y-1';
    }
    const naProfilu = window.location.pathname.includes('profile.html');
    if (naProfilu && imeUporabnika) imeUporabnika.href = '#';
} else {
    if (prijavaNaGumb) prijavaNaGumb.classList.remove('hidden');
    if (registracijaGumb) registracijaGumb.classList.remove('hidden');
    if (odjavaGumb) odjavaGumb.classList.add('hidden');
}

function odjava() {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('uporabnik');
    window.location.href = 'index.html';
}