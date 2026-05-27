const express = require('express');
const cors = require('cors');
const knex = require('knex');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const authRouter = require('./routes/auth');
const { preveriToken } = require('./routes/auth');

const app = express();
const PORT = 3000;

//ustvari mapo za slike, če ne obstaja
const imagesDir = path.join(__dirname, '../frontend/images');
if (!fs.existsSync(imagesDir)) fs.mkdirSync(imagesDir, {recursive: true});

// Middleware
app.use(cors());
app.use(express.json());

// Serviraj frontend in slike
app.use(express.static(path.join(__dirname, '../frontend')));
app.use('/images', express.static(imagesDir));

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

// Multer konfiguracija za shranjevanje slik v mapo /frontend/images/
const storage = multer.diskStorage({
    destination: path.join(__dirname, '../frontend/images/'),
    filename: (req, file, cb) => {
        const unikat = Date.now() + '-' + file.originalname;
        cb(null, unikat);
    }
});
const upload = multer({ storage });

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
            .select('slika', 'ime_slike', 'cover');

        const slikeBase64 = slike.map(s => ({
            ...s,
            slika: s.slika ? `data:image/jpeg;base64,${s.slika.toString('base64')}` : null
        }));

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
            slike: slikeBase64,
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
                'Prenocisce.datum_dodano',
                'Prenocisce.tip_prenocisca',
                'Prenocisce.opis_prenocisca',
                'Prenocisce.cena_na_noc',
                'Prenocisce.koordinate',
                'Prenocisce.naslov',
                'Prenocisce.sezona',
                'Prenocisce.max_gostov',
                'Prenocisce.stevilo_sob',
                'Prenocisce.wifi',        
                'Prenocisce.bazen', 
                'Prenocisce.parking', 
                'Prenocisce.zajtrk',    
                'Prenocisce.razgled',     
                'Prenocisce.ljubljencki',
                'Prenocisce.trajnostno',
                'Prenocisce.tagi',
                'Slika.slika as cover_slika',
                'Slika.ime_slike'
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

        if (req.query.ljubljencki === 'on') query.where('ljubljencki', true);
        if (req.query.bazen === 'on')       query.where('bazen', true);
        if (req.query.trajnostno === 'on')  query.where('trajnostno', true);
        if (req.query.parking === 'on')     query.where('parking', true);
        if (req.query.razgled === 'on')     query.where('razgled', true);
        if (req.query.zajtrk === 'on')      query.where('zajtrk', true);
        if (req.query.wifi === 'on')        query.where('wifi', true);

        // Filter po številu gostov
        if (req.query.stevilo_gostov) {
            query.where('max_gostov', '>=', Number(req.query.stevilo_gostov));
        }

        let prenocisca = await query;
        prenocisca = prenocisca.map(p => ({
        ...p,
        cover_slika: p.cover_slika 
            ? `data:image/jpeg;base64,${p.cover_slika.toString('base64')}` 
            : null
        }));

        // Filter po razpoložljivosti datumov
        if (req.query.datum_od && req.query.datum_do) {
            const od = req.query.datum_od;
            const do_ = req.query.datum_do;

            // Pridobi zasedena prenočišča iz rezervacij
            const zasedeneRez = await db('Rezervacija')
                .where('rezervirano', true)
                .where(function() {
                    this.where('datum_od', '<', do_)
                    .andWhere('datum_do', '>', od);
                })
            .select('TK_prenocisce');

                // Pridobi nedosegljive termine
            const zasedeneNT = await db('Nerazpolozljiv_termin')
            .where(function() {
                this.where('datum_od', '<', do_)
                    .andWhere('datum_do', '>', od);
                })
            .select('TK_prenocisce');

            const zasedeniIdi = new Set([
            ...zasedeneRez.map(r => r.TK_prenocisce),
            ...zasedeneNT.map(r => r.TK_prenocisce)
            ]);

            prenocisca = prenocisca.filter(p => !zasedeniIdi.has(p.ID_prenocisce));
        }

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


// DODAJ PRENOČIŠČE 
app.post('/dodaj-prenocisce', preveriToken, upload.fields([
    { name: 'slike',             maxCount: 20 },
    { name: 'dozivetje_slika[]', maxCount: 10 }
]), async (req, res) => {
    const body = req.body;
    try {
        //  Vstavi prenočišče
        const tagEmoji = [].concat(body['tag_emoji'] || body['tag_emoji[]'] || []);
        const tagNaziv = [].concat(body['tag_naziv'] || body['tag_naziv[]'] || []);
        const tagi = tagNaziv
        .filter(n => n)
        .map((naziv, i) => ({ emoji: tagEmoji[i] || '', naziv }));

        const [idPrenocisce] = await db('Prenocisce').insert({
            naziv:           body.naziv,
            tip_prenocisca:  body.tip_prenocisca,
            opis_prenocisca: body.opis_prenocisca,
            cena_na_noc:     body.cena_na_noc,
            koordinate:      body.koordinate || null,
            naslov:          body.naslov,
            sezona:          body.sezona || null,
            wifi:            body.wifi === 'on',
            parking:         body.parking === 'on',
            bazen:           body.bazen === 'on',
            zajtrk:          body.zajtrk === 'on',
            razgled:         body.razgled === 'on',
            ljubljencki:     body.ljubljencki === 'on',
            trajnostno:      body.trajnostno === 'on',
            max_gostov:      body.max_gostov,
            stevilo_sob:     body.stevilo_sob,
            tagi:            JSON.stringify(tagi),
            TK_uporabnik: req.uporabnik.id
    });
 
        // Vstavi slike prenočišča
        const coverIndex = parseInt(body.cover_slika_index) || 0;
        const slikePren  = req.files['slike'] || [];
        for (let i = 0; i < slikePren.length; i++) {
            await db('Slika').insert({
                slika:         fs.readFileSync(slikePren[i].path),
                ime_slike:     slikePren[i].originalname,
                cover:         (i === coverIndex),
                TK_prenocisce: idPrenocisce,
                TK_uporabnik:  null,
                TK_dozivetje:  null
            });
        }
 
        // Vstavi nedosegljive termine
        const terminiOd     = [].concat(body['termin_od[]']     || []);
        const terminiDo     = [].concat(body['termin_do[]']     || []);
        const terminiRazlog = [].concat(body['termin_razlog[]'] || []);
        for (let i = 0; i < terminiOd.length; i++) {
            if (terminiOd[i] && terminiDo[i]) {
                await db('Nerazpolozljiv_termin').insert({
                    datum_od:      terminiOd[i],
                    datum_do:      terminiDo[i],
                    razlog:        terminiRazlog[i] || '',
                    TK_prenocisce: idPrenocisce
                });
            }
        }
 
        // Preusmeri na domačo stran
        res.json({ uspeh: true });
    } catch (err) {
        console.error('Napaka pri shranjevanju:', err);
        res.status(500).json({ uspeh: false, napaka: 'Napaka pri shranjevanju.' });
    }
});


// Zagon strežnika
app.listen(PORT, () => {
    console.log(`Server teče na http://localhost:${PORT}`);
});