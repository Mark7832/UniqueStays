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
    if (imeUporabnika) imeUporabnika.textContent = podatki.ime;
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