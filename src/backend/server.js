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
        user: 'uniquestays',
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

//ISKANJE PRENOČIŠČ
app.get('/isci_prenocisca', async (req, res) => {
    try {
        //osnovna poizvedba s cover sliko
        let query = db('Prenocisce')
            .leftJoin('Slika', function() {
                this.on('Prenocisce.ID_prenocisce', '=', 'Slika.TK_prenocisce')
                    .andOn('Slika.cover', '=', db.raw('1'));
            })
            .select(
                'Prenocisce.ID_prenocisce',
                'Prenocisce.naziv',
                'Prenocisce.tip_prenocisca',
                'Prenocisce.opis_prenocisca',
                'Prenocisce.cena_na_noc',
                'Prenocisce.koordinate',
                'Prenocisce.naslov',
                'Prenocisce.max_gostov',
                'Prenocisce.stevilo_sob',
                'Prenocisce.sezona',
                'Slika.pot_slike as cover_slika'
            );

        //filtri
        if (req.query.destinacija && req.query.destinacija !== '') {
            query.where(function () {
                this.where('naslov', 'like', `%${req.query.destinacija}%`)
                .orWhere('naziv', 'like', `%${req.query.destinacija}%`);
            });
        }

        if (req.query.tip_prenocisca && req.query.tip_prenocisca !== '') {
            query.where('tip_prenocisca', req.query.tip_prenocisca);
        }

        if (req.query.cena_min) {
            query.where('cena_na_noc', '>=', Number(req.query.cena_min));
        }

        if (req.query.cena_max) {
            query.where('cena_na_noc', '<=', Number(req.query.cena_max));
        }

        //razvrščanje
        if (req.query.sort === 'price_asc') {
            query.orderBy('cena_na_noc', 'asc');
        } else if (req.query.sort === 'price_desc') {
            query.orderBy('cena_na_noc', 'desc');
        }

        let prenocisca = await query;

        //dodaj povprečno oceno za vsako prenočišče
        for (let p of prenocisca) {
            const komentarji = await db('Komentar')
                .where('TK_prenocisce', p.ID_prenocisce)
                .select('ocena_splosna');

            p.povprecna_ocena = komentarji.length > 0
                ? (komentarji.reduce((sum, k) => sum + k.ocena_splosna, 0) / komentarji.length).toFixed(1)
                : null;
        }

        //filter po oceni (po izračunu)
        if (req.query.ocena) {
            const minOcena = parseFloat(req.query.ocena);
            prenocisca = prenocisca.filter(p => p.povprecna_ocena && parseFloat(p.povprecna_ocena) >= minOcena);
        }

        //razvrščanje po oceni
        if (req.query.sort === 'rating_desc') {
            prenocisca.sort((a, b) => (parseFloat(b.povprecna_ocena) || 0) - (parseFloat(a.povprecna_ocena) || 0));
        }

        res.json(prenocisca);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Napaka pri iskanju' });
    }
});

// Zagon strežnika
app.listen(PORT, () => {
    console.log(`Server teče na http://localhost:${PORT}`);
});