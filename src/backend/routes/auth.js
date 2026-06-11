const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
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

// Middleware za preverjanje admin pravic
function preveriAdmin(req, res, next) {
    if (!req.uporabnik || !req.uporabnik.je_admin) {
        return res.status(403).json({ napaka: 'Dostop dovoljen samo administratorjem.' });
    }
    next();
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
            je_admin: false,
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

        // Token zdaj vsebuje tudi je_admin
        const token = jwt.sign(
            { 
                id: uporabnik.ID_uporabnik, 
                email: uporabnik.email,
                je_admin: uporabnik.je_admin === 1 || uporabnik.je_admin === true
            },
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
                email: uporabnik.email,
                je_admin: uporabnik.je_admin === 1 || uporabnik.je_admin === true
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
            .select('ID_uporabnik', 'ime_uporabnika', 'priimek_uporabnika', 'email', 'drzava', 'opis', 'je_admin', 'ustvarjen_od', 'profilna_slika')
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

router.post('/profilna-slika', preveriToken, upload.single('slika'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ napaka: 'Ni slike.' });
        await req.db('Uporabnik')
            .where('ID_uporabnik', req.uporabnik.id)
            .update({ profilna_slika: req.file.buffer });
        res.json({ sporocilo: 'Slika uspešno shranjena.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ napaka: 'Napaka pri shranjevanju slike.' });
    }
});

router.get('/profilna-slika/:id', async (req, res) => {
    try {
        const u = await req.db('Uporabnik')
            .where('ID_uporabnik', req.params.id)
            .select('profilna_slika')
            .first();
        if (!u || !u.profilna_slika) return res.status(404).end();
        res.set('Content-Type', 'image/jpeg');
        res.set('Cache-Control', 'public, max-age=86400');
        res.send(u.profilna_slika);
    } catch (err) {
        res.status(500).end();
    }
});

module.exports = router;
module.exports.preveriToken = preveriToken;
module.exports.preveriAdmin = preveriAdmin;