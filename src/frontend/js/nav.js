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
    if (imeUporabnika) imeUporabnika.textContent = 'Profil';
    // skrij moznost profil ce si na profilu 
    const naProfilu = window.location.pathname.includes('profile.html');
    if (naProfilu && imeUporabnika) imeUporabnika.classList.add('hidden');
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