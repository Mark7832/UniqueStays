const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = 'uniquestays_secret_kljuc';

// REGISTRACIJA
router.post('/registracija', async (req, res) => {
    try {
        const { ime_uporabnika, priimek_uporabnika, email, drzava, geslo } = req.body;

        // Preveri če uporabnik že obstaja
        const obstaja = await req.db('Uporabnik').where('email', email).first();
        if (obstaja) {
            return res.status(400).json({ napaka: 'Uporabnik s tem emailom že obstaja.' });
        }

        // Hashiraj geslo
        const hash = await bcrypt.hash(geslo, 10);

        // Shrani uporabnika v bazo
        await req.db('Uporabnik').insert({
            ime_uporabnika,
            priimek_uporabnika,
            email,
            drzava,
            geslo: hash,
            ustvarjen_od: new Date().toISOString().split('T')[0]
        });

        res.status(201).json({ sporocilo: 'Registracija uspešna.' });

    } catch (error) {
        console.error('Napaka pri registraciji:', error);
        res.status(500).json({ napaka: 'Napaka pri registraciji.' });
    }
});

// PRIJAVA
router.post('/prijava', async (req, res) => {
    try {
        const { email, geslo } = req.body;

        // Poišči uporabnika
        const uporabnik = await req.db('Uporabnik').where('email', email).first();
        if (!uporabnik) {
            return res.status(401).json({ napaka: 'Napačen email ali geslo.' });
        }

        // Preveri geslo
        const gesl0Ujema = await bcrypt.compare(geslo, uporabnik.geslo);
        if (!gesl0Ujema) {
            return res.status(401).json({ napaka: 'Napačen email ali geslo.' });
        }

        // Ustvari JWT token
        const token = jwt.sign(
            { id: uporabnik.ID_uporabnik, email: uporabnik.email },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            sporocilo: 'Prijava uspešna.',
            token,
            uporabnik: {
                id: uporabnik.ID_uporabnik,
                ime: uporabnik.ime_uporabnika,
                priimek: uporabnik.priimek_uporabnika,
                email: uporabnik.email
            }
        });

    } catch (error) {
        console.error('Napaka pri prijavi:', error);
        res.status(500).json({ napaka: 'Napaka pri prijavi.' });
    }
});

module.exports = router;