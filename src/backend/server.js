const express = require('express');
const cors = require('cors');
const knex = require('knex');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const authRouter = require('./routes/auth');
const { preveriToken, preveriAdmin } = require('./routes/auth');

const app = express();
const PORT = 3000;

//ustvari mapo za slike, če ne obstaja
const imagesDir = path.join(__dirname, '../frontend/images');
if (!fs.existsSync(imagesDir)) fs.mkdirSync(imagesDir, { recursive: true });

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
            .leftJoin('Slika', function () {
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
            .leftJoin('Slika', function () {
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
        if (req.query.bazen === 'on') query.where('bazen', true);
        if (req.query.trajnostno === 'on') query.where('trajnostno', true);
        if (req.query.parking === 'on') query.where('parking', true);
        if (req.query.razgled === 'on') query.where('razgled', true);
        if (req.query.zajtrk === 'on') query.where('zajtrk', true);
        if (req.query.wifi === 'on') query.where('wifi', true);

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
                .where(function () {
                    this.where('datum_od', '<', do_)
                        .andWhere('datum_do', '>', od);
                })
                .select('TK_prenocisce');

            // Pridobi nedosegljive termine
            const zasedeneNT = await db('Nerazpolozljiv_termin')
                .where(function () {
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
    { name: 'slike', maxCount: 20 },
]), async (req, res) => {
    // shrani podatke iz forme (body)
    const body = req.body;
    console.log('BODY PODATKI:', body);
    try {
        //  Vstavi prenočišče
        //  pobere tag  in pretvoi v array objekt
        const tagNaziv = [].concat(body['tag_naziv'] || body['tag_naziv[]'] || []);
        const tagi = tagNaziv
            .filter(n => n)
            .map(naziv => ({ naziv }));

        const [idPrenocisce] = await db('Prenocisce').insert({
            naziv: body.naziv,
            tip_prenocisca: body.tip_prenocisca,
            opis_prenocisca: body.opis_prenocisca,
            cena_na_noc: body.cena_na_noc,
            koordinate: body.koordinate || null,
            naslov: body.naslov,
            sezona: body.sezona,
            wifi: body.wifi === 'on',
            parking: body.parking === 'on',
            bazen: body.bazen === 'on',
            zajtrk: body.zajtrk === 'on',
            razgled: body.razgled === 'on',
            ljubljencki: body.ljubljencki === 'on',
            trajnostno: body.trajnostno === 'on',
            max_gostov: body.max_gostov,
            stevilo_sob: body.stevilo_sob,
            tagi: JSON.stringify(tagi),
            TK_uporabnik: req.uporabnik.id
        });

        // Vstavi slike prenočišča
        const coverIndex = parseInt(body.cover_slika_index) || 0; //ce ni nobena druga izbrana slika cover bo prva
        const slikePren = req.files['slike'] || []; // poberi slike ( Multer shranil na disk) prazen array če ni slik
        for (let i = 0; i < slikePren.length; i++) {
            await db('Slika').insert({
                slika: fs.readFileSync(slikePren[i].path),
                ime_slike: slikePren[i].filename,
                cover: (i === coverIndex),
                TK_prenocisce: idPrenocisce,
                TK_uporabnik: null,
                TK_dozivetje: null
            });
        }

        // Vstavi nedosegljive termine
        console.log('TERMINI:', body['termin_od'], body['termin_do']);

        const terminiOd = [].concat(body['termin_od'] || []);
        const terminiDo = [].concat(body['termin_do'] || []);
        const terminiRazlog = [].concat(body['termin_razlog'] || []);

        for (let i = 0; i < terminiOd.length; i++) {
            if (terminiOd[i] && terminiDo[i]) {
                await db('Nerazpolozljiv_termin').insert({
                    datum_od: terminiOd[i] + 'T12:00:00',
                    datum_do: terminiDo[i] + 'T12:00:00',
                    razlog: terminiRazlog[i] || '',
                    TK_prenocisce: idPrenocisce
                });
            }
        }

        res.json({ uspeh: true });
    } catch (err) {
        console.error('Napaka pri shranjevanju:', err);
        res.status(500).json({ uspeh: false, napaka: 'Napaka pri shranjevanju.' });
    }
});

// Pridobi podatke enega prenočišča za urejanje (samo lastnik)
app.get('/prenocisce/:id', preveriToken, async (req, res) => {
    try {
        const prenocisce = await db('Prenocisce')
            .where('ID_prenocisce', req.params.id)
            .where('TK_uporabnik', req.uporabnik.id)
            .first(); // vrne objekt namesto arraya
        if (!prenocisce) return res.status(404).json({ napaka: 'Ni najdeno.' });

        const termini = (await db('Nerazpolozljiv_termin')
            .where('TK_prenocisce', req.params.id)
            .select()).map(t => ({
                ...t,
                datum_od: t.datum_od ? t.datum_od.toLocaleDateString('sv-SE') : null, //ga pretvori v string
                datum_do: t.datum_do ? t.datum_do.toLocaleDateString('sv-SE') : null, //sv-SE švedska lokalizacija-> format (YYYY-MM-DD)
            }));

        const slike = await db('Slika')
            .where('TK_prenocisce', req.params.id)
            .select('ID_slika', 'ime_slike', 'cover');

        res.json({ ...prenocisce, termini, slike });
    } catch (err) {
        console.error(err);
        res.status(500).json({ napaka: 'Napaka.' });
    }
});

// Posodobi prenocisce (samo lastnik)
app.put('/prenocisce/:id', preveriToken, upload.fields([
    { name: 'slike', maxCount: 20 }
]), async (req, res) => {
    try {
        const body = req.body;
        await db('Prenocisce')
            .where('ID_prenocisce', req.params.id)
            .where('TK_uporabnik', req.uporabnik.id)
            .update({
                naziv: body.naziv,
                tip_prenocisca: body.tip_prenocisca,
                opis_prenocisca: body.opis_prenocisca,
                naslov: body.naslov,
                koordinate: body.koordinate,
                cena_na_noc: body.cena_na_noc,
                max_gostov: body.max_gostov,
                stevilo_sob: body.stevilo_sob,
                sezona: body.sezona,
                bazen: body.bazen === 'on',
                parking: body.parking === 'on',
                wifi: body.wifi === 'on',
                zajtrk: body.zajtrk === 'on',
                ljubljencki: body.ljubljencki === 'on',
                razgled: body.razgled === 'on',
                trajnostno: body.trajnostno === 'on',
                tagi: JSON.stringify(
                    [].concat(body['tag_naziv'] || body['tag_naziv[]'] || [])
                        .filter(n => n)
                        .map(naziv => ({ naziv }))
                ),
            });

        // Posodobi termine - zbriši stare in dodaj nove
        await db('Nerazpolozljiv_termin').where('TK_prenocisce', req.params.id).del();//zbrise stare termine

        const terminiOd = [].concat(body['termin_od'] || []);
        const terminiDo = [].concat(body['termin_do'] || []);
        const terminiRazlog = [].concat(body['termin_razlog'] || []);

        for (let i = 0; i < terminiOd.length; i++) {
            if (terminiOd[i] && terminiDo[i]) {
                await db('Nerazpolozljiv_termin').insert({
                    datum_od: terminiOd[i] + 'T12:00:00',
                    datum_do: terminiDo[i] + 'T12:00:00',
                    razlog: terminiRazlog[i] || '',
                    TK_prenocisce: req.params.id
                });
            }
        }

        // Zbriši označene obstoječe slike
        const odstranjene = [].concat(body['odstranjenaSlika[]'] || body['odstranjenaSlika'] || []);
        for (const id of odstranjene) {
            const slika = await db('Slika').where('ID_slika', id).first();
            if (slika) {
                const pot = path.join(imagesDir, slika.ime_slike);
                if (fs.existsSync(pot)) fs.unlinkSync(pot); //ce obstaja fizicna slika jo izbrisi
                await db('Slika').where('ID_slika', id).del();//zbrisi se v bazi
            }
        }

        // Pridobi cover index
        const coverIndex = body['cover-index'] || body.cover_slika_index || '0'; // ce uporabnik izbral katere druge slike je potem prva slika cover

        // Najprej nastavi vse obstoječe slike na cover = false
        await db('Slika').where('TK_prenocisce', req.params.id).update({ cover: false });

        // Če je cover obstoječa slika (obs-ID)
        if (coverIndex && coverIndex.toString().startsWith('obs-')) {
            const obsId = coverIndex.toString().replace('obs-', '');
            await db('Slika').where('ID_slika', obsId).update({ cover: true });
        }

        // Dodaj nove slike
        const noveSlike = req.files['slike'] || [];
        for (let i = 0; i < noveSlike.length; i++) {
            const jeNovaCover = !coverIndex.toString().startsWith('obs-') && i === parseInt(coverIndex); //  nova slika je cover   če se coverIndex ne začne z 'obs-' in se indeks ujema
            await db('Slika').insert({
                slika: fs.readFileSync(noveSlike[i].path),
                ime_slike: noveSlike[i].filename,
                cover: jeNovaCover,
                TK_prenocisce: req.params.id,
                TK_uporabnik: null,
                TK_dozivetje: null
            });
        }

        res.json({ uspeh: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ napaka: 'Napaka pri posodabljanju.' });
    }
});

// Pridobi prenočišča prijavljenega uporabnika
app.get('/moja-prenocisca', preveriToken, async (req, res) => {
    try {
        const prenocisca = await db('Prenocisce')
            .where('TK_uporabnik', req.uporabnik.id)
            .select();
        res.json(prenocisca);
    } catch (err) {
        console.error(err);
        res.status(500).json({ napaka: 'Napaka pri pridobivanju prenočišč.' });
    }
});

// Izbriši prenočišče
app.delete('/prenocisce/:id', preveriToken, async (req, res) => {
    try {
        // Pridobi slike iz baze pred brisanjem
        const slike = await db('Slika')
            .where('TK_prenocisce', req.params.id)
            .select('ime_slike');

        // Zbrisi fizicne datoteke
        slike.forEach(slika => {
            const pot = path.join(imagesDir, slika.ime_slike);
            if (fs.existsSync(pot)) fs.unlinkSync(pot);
        });
        // brisanje iz baze
        await db('Slika')
            .where('TK_prenocisce', req.params.id)
            .del();

        await db('Nerazpolozljiv_termin')
            .where('TK_prenocisce', req.params.id)
            .del();

        await db('Prenocisce')
            .where('ID_prenocisce', req.params.id)
            .del();

        res.json({ uspeh: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ napaka: 'Napaka pri brisanju.' });
    }
});

//vsa doživetja prijavljenega uporabnika
app.get('/api/dozivetja', preveriToken, async (req, res) => {
    try {
        const dozivetja = await db('Dozivetje')
            .leftJoin('Prenocisce', 'Dozivetje.TK_prenocisce', 'Prenocisce.ID_prenocisce')
            .where('Dozivetje.TK_uporabnik', req.uporabnik.id)
            .select('Dozivetje.*', 'Prenocisce.naziv as naziv_prenocisca')
            .orderBy('Dozivetje.ID_dozivetje', 'desc');
        res.json(dozivetja);
    } catch (err) {
        console.error(err);
        res.status(500).json({ napaka: 'Napaka pri pridobivanju doživetij.' });
    }
});

//dodaj novo doživetje (brez prenočišča)
app.post('/api/dozivetje', preveriToken, async (req, res) => {
    try {
        const { naziv, opis, doplacilo } = req.body;
        if (!naziv || !opis || doplacilo === undefined) {
            return res.status(400).json({ napaka: 'Naziv, opis in doplačilo so obvezna polja.' });
        }
        const [id] = await db('Dozivetje').insert({
            naziv,
            opis,
            doplacilo: parseFloat(doplacilo),
            TK_prenocisce: null,
            TK_rezervacija: null,
            TK_uporabnik: req.uporabnik.id
        });
        res.json({ uspeh: true, id });
    } catch (err) {
        console.error(err);
        res.status(500).json({ napaka: 'Napaka pri dodajanju doživetja.' });
    }
});

//posodobi naziv/opis/doplačilo (samo lastnik)
app.put('/api/dozivetje/:id', preveriToken, async (req, res) => {
    try {
        const { naziv, opis, doplacilo } = req.body;
        const posodobljeno = await db('Dozivetje')
            .where('ID_dozivetje', req.params.id)
            .where('TK_uporabnik', req.uporabnik.id)
            .update({ naziv, opis, doplacilo: parseFloat(doplacilo) });
        if (!posodobljeno) return res.status(404).json({ napaka: 'Doživetje ni najdeno.' });
        res.json({ uspeh: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ napaka: 'Napaka pri posodabljanju doživetja.' });
    }
});

//izbriši doživetje (samo lastnik)
app.delete('/api/dozivetje/:id', preveriToken, async (req, res) => {
    try {
        const izbrisano = await db('Dozivetje')
            .where('ID_dozivetje', req.params.id)
            .where('TK_uporabnik', req.uporabnik.id)
            .del();
        if (!izbrisano) return res.status(404).json({ napaka: 'Doživetje ni najdeno.' });
        res.json({ uspeh: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ napaka: 'Napaka pri brisanju doživetja.' });
    }
});

//veži/odveži doživetje na prenočišče (profil)
// Body: { TK_prenocisce: <id ali null> }
app.put('/api/dozivetje/:id/vezava', preveriToken, async (req, res) => {
    try {
        const { TK_prenocisce } = req.body;
        //preveri da doživetje pripada temu uporabniku
        const dozivetje = await db('Dozivetje')
            .where('ID_dozivetje', req.params.id)
            .where('TK_uporabnik', req.uporabnik.id)
            .first();
        if (!dozivetje) return res.status(404).json({ napaka: 'Doživetje ni najdeno.' });
        //če je prenočišče podano, preveri ali je vezano na tega uporabnika
        if (TK_prenocisce) {
            const prenoc = await db('Prenocisce')
                .where('ID_prenocisce', TK_prenocisce)
                .where('TK_uporabnik', req.uporabnik.id)
                .first();
            if (!prenoc) return res.status(403).json({ napaka: 'Prenočišče ne pripada vam.' });
        }

        await db('Dozivetje')
            .where('ID_dozivetje', req.params.id)
            .update({ TK_prenocisce: TK_prenocisce || null });

        res.json({ uspeh: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ napaka: 'Napaka pri vezavi.' });
    }
});

//javna doživetja za konkretno prenočišče (za podrobnosti)
app.get('/api/prenocisce/:id/dozivetja', async (req, res) => {
    try {
        const dozivetja = await db('Dozivetje')
            .where('TK_prenocisce', req.params.id)
            .select('ID_dozivetje', 'naziv', 'opis', 'doplacilo');
        res.json(dozivetja);
    } catch (err) {
        console.error(err);
        res.status(500).json({ napaka: 'Napaka.' });
    }
});

// REZERVACIJA - vrni zasedene datume za prenočišče
app.get('/api/rezervacija/:id/zasedeni', async (req, res) => {
    try {
        const id = req.params.id;

        const rezervacije = await db('Rezervacija')
            .where('TK_prenocisce', id)
            .where('rezervirano', true)
            .select('datum_od', 'datum_do');

        const termini = await db('Nerazpolozljiv_termin')
            .where('TK_prenocisce', id)
            .select('datum_od', 'datum_do');

        res.json({ rezervacije, termini });
    } catch (err) {
        console.error(err);
        res.status(500).json({ napaka: 'Napaka pri pridobivanju zasedenosti.' });
    }
});

// REZERVACIJA - ustvari novo rezervacijo
app.post('/api/rezervacija', preveriToken, async (req, res) => {
    try {
        const { ID_prenocisce, datum_prihoda, datum_odhoda } = req.body;

        if (!ID_prenocisce || !datum_prihoda || !datum_odhoda) {
            return res.status(400).json({ napaka: 'Manjkajo obvezni podatki.' });
        }

        const prenocisce = await db('Prenocisce').where('ID_prenocisce', ID_prenocisce).first();
        if (!prenocisce) {
            return res.status(404).json({ napaka: 'Prenočišče ne obstaja.' });
        }

        // Preveri prekrivanje z obstoječimi rezervacijami
        const prekrivanje = await db('Rezervacija')
            .where('TK_prenocisce', ID_prenocisce)
            .where('rezervirano', true)
            .where(function () {
                this.where('datum_od', '<', datum_odhoda)
                    .andWhere('datum_do', '>', datum_prihoda);
            })
            .first();

        if (prekrivanje) {
            return res.status(409).json({ napaka: 'Prenočišče je v izbranem obdobju že zasedeno. Izberite druge datume.' });
        }

        // Preveri prekrivanje z nedosegljivimi termini
        const nedosegljivo = await db('Nerazpolozljiv_termin')
            .where('TK_prenocisce', ID_prenocisce)
            .where(function () {
                this.where('datum_od', '<', datum_odhoda)
                    .andWhere('datum_do', '>', datum_prihoda);
            })
            .first();

        if (nedosegljivo) {
            return res.status(409).json({ napaka: 'Prenočišče ni dosegljivo v izbranem obdobju. Izberite druge datume.' });
        }

        const danes = new Date().toISOString().split('T')[0];

        const [id] = await db('Rezervacija').insert({
            datum_od: datum_prihoda,
            datum_do: datum_odhoda,
            datum_rezervacije: danes,
            rezervirano: true,
            TK_prenocisce: ID_prenocisce,
            TK_uporabnik: req.uporabnik.id
        });

        res.status(201).json({ uspeh: true, ID_rezervacija: id });
    } catch (err) {
        console.error('Napaka pri rezervaciji:', err);
        res.status(500).json({ napaka: 'Napaka pri shranjevanju rezervacije.' });
    }
});

// SPOROCILA - pridobi vsa sporocila za prenočišče
app.get('/api/sporocila/:id', async (req, res) => {
    try {
        const sporocila = await db('Sporocila')
            .leftJoin('Uporabnik', 'Sporocila.TK_uporabnik', 'Uporabnik.ID_uporabnik')
            .where('Sporocila.TK_prenocisce', req.params.id)
            .select(
                'Sporocila.*',
                'Uporabnik.ime_uporabnika',
                'Uporabnik.priimek_uporabnika'
            )
            .orderBy('Sporocila.datum_sporocila', 'desc');
        res.json(sporocila);
    } catch (err) {
        console.error(err);
        res.status(500).json({ napaka: 'Napaka pri pridobivanju sporočil.' });
    }
});

// SPOROCILA - dodaj novo vprašanje (prijavljeni user)
app.post('/api/sporocila', preveriToken, async (req, res) => {
    try {
        const { vprasanje, TK_prenocisce } = req.body;
        if (!vprasanje || !TK_prenocisce) {
            return res.status(400).json({ napaka: 'Vprašanje in ID prenočišča sta obvezna.' });
        }
        await db('Sporocila').insert({
            vprasanje,
            datum_sporocila: new Date().toISOString().split('T')[0],
            TK_uporabnik: req.uporabnik.id,
            TK_prenocisce
        });
        res.status(201).json({ sporocilo: 'Vprašanje uspešno dodano.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ napaka: 'Napaka pri dodajanju vprašanja.' });
    }
});

// SPOROCILA - admin in lastnik lahko odgovori na vprašanje
app.put('/api/sporocila/:id', preveriToken, async (req, res) => {
    try {
        const { odgovor } = req.body;
        if (!odgovor) {
            return res.status(400).json({ napaka: 'Odgovor je obvezen.' });
        }

        // Poišči sporočilo
        const sporocilo = await db('Sporocila')
            .where('ID_sporocila', req.params.id)
            .first();

        if (!sporocilo) {
            return res.status(404).json({ napaka: 'Sporočilo ne obstaja.' });
        }

        // Preveri ali je admin ALI lastnik prenočišča
        const jeAdmin = req.uporabnik.je_admin === 1 || req.uporabnik.je_admin === true;
        const jeLastnik = await db('Prenocisce')
            .where('ID_prenocisce', sporocilo.TK_prenocisce)
            .where('TK_uporabnik', req.uporabnik.id)
            .first();

        console.log('uporabnik id:', req.uporabnik.id);
        console.log('lastnik prenocisca:', jeLastnik);
        console.log('je admin:', req.uporabnik.je_admin);

        if (!jeAdmin && !jeLastnik) {
            return res.status(403).json({ napaka: 'Nimate pravice odgovoriti na to sporočilo.' });
        }

        await db('Sporocila')
            .where('ID_sporocila', req.params.id)
            .update({ odgovor });

        res.json({ sporocilo: 'Odgovor uspešno shranjen.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ napaka: 'Napaka pri shranjevanju odgovora.' });
    }
});

// Zagon strežnika
app.listen(PORT, () => {
    console.log(`Server teče na http://localhost:${PORT}`);
});