document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const napaka = document.getElementById('napaka');
    napaka.classList.add('hidden');

    const podatki = {
        email: this.email.value,
        geslo: this.password.value
    };

    if (!podatki.email || !podatki.geslo) {
        napaka.textContent = 'Prosimo, izpolnite vsa polja.';
        napaka.classList.remove('hidden');
        return;
    }

    try {
        const odgovor = await fetch('http://localhost:3000/api/auth/prijava', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(podatki)
        });

        const rezultat = await odgovor.json();

        if (odgovor.ok) {
            sessionStorage.setItem('token', rezultat.token);
            sessionStorage.setItem('uporabnik', JSON.stringify(rezultat.uporabnik));
            if(uspeh){
                uspeh.textContent = 'Prijava uspešna!';
                uspeh.classList.remove('hidden');
            }
            setTimeout(() => { window.location.href = 'index.html';}, 1500);
        } else {
            napaka.textContent = rezultat.napaka;
            napaka.classList.remove('hidden');
        }
    } catch (err) {
        napaka.textContent = 'Napaka pri povezavi s strežnikom.';
        napaka.classList.remove('hidden');
    }
});