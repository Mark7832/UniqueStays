const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = 'uniquestays_secret_kljuc';

// Middleware za preverjanje JWT tokena
function preveriToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ napaka: 'Ni tokena.' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.uporabnik = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ napaka: 'Neveljaven token.' });
    }
}

// REGISTRACIJA
router.post('/registracija', async (req, res) => {
    try {
        const { ime_uporabnika, priimek_uporabnika, email, drzava, geslo } = req.body;

        const obstaja = await req.db('Uporabnik').where('email', email).first();
        if (obstaja) {
            return res.status(400).json({ napaka: 'Uporabnik s tem emailom že obstaja.' });
        }

        const hash = await bcrypt.hash(geslo, 10);

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

        const uporabnik = await req.db('Uporabnik').where('email', email).first();
        if (!uporabnik) {
            return res.status(401).json({ napaka: 'Napačen email ali geslo.' });
        }

        const gesloUjema = await bcrypt.compare(geslo, uporabnik.geslo);
        if (!gesloUjema) {
            return res.status(401).json({ napaka: 'Napačen email ali geslo.' });
        }

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

// PRIDOBI PROFIL
router.get('/profil', preveriToken, async (req, res) => {
    try {
        const uporabnik = await req.db('Uporabnik')
            .where('ID_uporabnik', req.uporabnik.id)
            .select('ID_uporabnik', 'ime_uporabnika', 'priimek_uporabnika', 'email', 'drzava', 'opis', 'ustvarjen_od')
            .first();

        if (!uporabnik) {
            return res.status(404).json({ napaka: 'Uporabnik ne obstaja.' });
        }

        res.json(uporabnik);

    } catch (error) {
        console.error('Napaka pri pridobivanju profila:', error);
        res.status(500).json({ napaka: 'Napaka pri pridobivanju profila.' });
    }
});

// POSODOBI PROFIL
router.put('/profil', preveriToken, async (req, res) => {
    try {
        const { ime_uporabnika, priimek_uporabnika, email, drzava, opis } = req.body;

        // Preveri če email že obstaja pri drugem uporabniku
        if (email) {
            const obstaja = await req.db('Uporabnik')
                .where('email', email)
                .whereNot('ID_uporabnik', req.uporabnik.id)
                .first();
            if (obstaja) {
                return res.status(400).json({ napaka: 'Ta email že uporablja drug uporabnik.' });
            }
        }

        await req.db('Uporabnik')
            .where('ID_uporabnik', req.uporabnik.id)
            .update({ ime_uporabnika, priimek_uporabnika, email, drzava, opis });

        res.json({ sporocilo: 'Profil uspešno posodobljen.' });

    } catch (error) {
        console.error('Napaka pri posodabljanju profila:', error);
        res.status(500).json({ napaka: 'Napaka pri posodabljanju profila.' });
    }
});

// SPREMENI GESLO
router.put('/geslo', preveriToken, async (req, res) => {
    try {
        const { staro_geslo, novo_geslo } = req.body;

        const uporabnik = await req.db('Uporabnik')
            .where('ID_uporabnik', req.uporabnik.id)
            .first();

        const gesloUjema = await bcrypt.compare(staro_geslo, uporabnik.geslo);
        if (!gesloUjema) {
            return res.status(400).json({ napaka: 'Staro geslo ni pravilno.' });
        }

        const hash = await bcrypt.hash(novo_geslo, 10);

        await req.db('Uporabnik')
            .where('ID_uporabnik', req.uporabnik.id)
            .update({ geslo: hash });

        res.json({ sporocilo: 'Geslo uspešno spremenjeno.' });

    } catch (error) {
        console.error('Napaka pri spremembi gesla:', error);
        res.status(500).json({ napaka: 'Napaka pri spremembi gesla.' });
    }
});

module.exports = router;
module.exports.preveriToken = preveriToken;