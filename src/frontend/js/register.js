document.getElementById('registerForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const napaka = document.getElementById('napaka');
    napaka.classList.add('hidden');

    const podatki = {
        ime_uporabnika: this.firstName.value,
        priimek_uporabnika: this.lastName.value,
        email: this.email.value,
        drzava: this.country.value,
        geslo: this.password.value
    };

    if (!podatki.ime_uporabnika || !podatki.priimek_uporabnika || !podatki.email || !podatki.drzava || !podatki.geslo) {
        napaka.textContent = 'Prosimo, izpolnite vsa polja.';
        napaka.classList.remove('hidden');
        return;
    }

    if (podatki.geslo !== this.confirmPassword.value) {
        napaka.textContent = 'Gesli se ne ujemata.';
        napaka.classList.remove('hidden');
        return;
    }

    try {
        const odgovor = await fetch('http://localhost:3000/api/auth/registracija', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(podatki)
        });

        const rezultat = await odgovor.json();

        if (odgovor.ok) {
            if (uspeh){
                uspeh.textContent = 'Registracija uspešna! Preusmeritev na prijavo...';
                uspeh.classList.remove('hidden');
            }
            setTimeout(() => { window.location.href = 'login.html';}, 1500);
        } else {
            napaka.textContent = rezultat.napaka;
            napaka.classList.remove('hidden');
        }
    } catch (err) {
        napaka.textContent = 'Napaka pri povezavi s strežnikom.';
        napaka.classList.remove('hidden');
    }
});