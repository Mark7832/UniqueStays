const express = require('express');
const cors = require('cors');
const knex = require('knex');
const authRouter = require('./routes/auth');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Knex konfiguracija
const db = knex({
    client: 'mysql2',
    connection: {
        host: '127.0.0.1',
        user: 'root',
        password: 'geslo',
        database: 'uniquestays'
    }
});

// Dodaj db na vsak request
app.use((req, res, next) => {
    req.db = db;
    next();
});

// Auth router (registracija in prijava)
app.use('/api/auth', authRouter);

// API endpoint za pridobivanje podatkov o prenočišču
app.get('/api/prenocisce/:id', async (req, res) => {
    try {
        const id = req.params.id;
        
        // Pridobi osnovne podatke o prenočišču
        const prenocisce = await db('Prenocisce')
            .where('ID_prenocisce', id)
            .first();

        if (!prenocisce) {
            return res.status(404).json({ error: 'Prenočišče ni bilo najdeno' });
        }

        // Pridobi slike
        const slike = await db('Slika')
            .where('TK_prenocisce', id)
            .select('pot_slike', 'cover');

        // Pridobi doživetja
        const dozivetja = await db('Dozivetje')
            .where('TK_prenocisce', id)
            .select('*');

        // Pridobi komentarje z uporabniki
        const komentarji = await db('Komentar')
            .join('Uporabnik', 'Komentar.TK_uporabnik', 'Uporabnik.ID_uporabnik')
            .where('Komentar.TK_prenocisce', id)
            .select(
                'Komentar.*',
                'Uporabnik.ime_uporabnika',
                'Uporabnik.priimek_uporabnika',
                'Uporabnik.drzava'
            )
            .orderBy('datum_komentar', 'desc');

        // Izračunaj povprečno oceno
        const povprecnaOcena = komentarji.length > 0
            ? (komentarji.reduce((sum, k) => sum + k.ocena_splosna, 0) / komentarji.length).toFixed(1)
            : 0;

        res.json({
            prenocisce,
            slike,
            dozivetja,
            komentarji,
            povprecnaOcena
        });
    } catch (error) {
        console.error('Napaka pri pridobivanju podatkov:', error);
        res.status(500).json({ error: 'Napaka pri pridobivanju podatkov' });
    }
});

// API endpoint za vsa prenočišča (za seznam)
app.get('/api/prenocisca', async (req, res) => {
    try {
        const prenocisca = await db('Prenocisce')
            .leftJoin('Slika', function() {
                this.on('Prenocisce.ID_prenocisce', '=', 'Slika.TK_prenocisce')
                    .andOn('Slika.cover', '=', db.raw('true'));
            })
            .select(
                'Prenocisce.*',
                'Slika.pot_slike as cover_slika'
            );

        res.json(prenocisca);
    } catch (error) {
        console.error('Napaka pri pridobivanju seznama:', error);
        res.status(500).json({ error: 'Napaka pri pridobivanju seznama' });
    }
});

// Zagon strežnika
app.listen(PORT, () => {
    console.log(`Server teče na http://localhost:${PORT}`);
});