const express = require('express');
const cors = require('cors');
const knex = require('knex');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const authRouter = require('./routes/auth');
const { preveriToken, preveriAdmin } = require('./routes/auth');
const nodemailer = require('nodemailer');
const { get } = require('http');

// EMAIL KONFIGURACIJA
if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error("EMAIL credentials are missing in .env");
}

const emailTransporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

async function posljiPotrditevRezervacije({ email, ime, naziv, prihod, odhod, gostov, noci, cena, rezervacijaId }) {
    const formatirajDatum = (str) => {
        const d = new Date(str);
        return d.toLocaleDateString('sl-SI', { day: 'numeric', month: 'long', year: 'numeric' });
    };

    const html = `
    <!DOCTYPE html>
    <html lang="sl">
    <head><meta charset="UTF-8"/></head>
    <body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 0;">
        <tr><td align="center">
          <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

            <!-- HEADER -->
            <tr>
              <td style="background:linear-gradient(135deg,#2563eb,#14b8a6);padding:40px 40px 32px;text-align:center;">
                <div style="font-size:48px;margin-bottom:8px;">✅</div>
                <h1 style="color:#ffffff;font-size:28px;font-weight:800;margin:0 0 8px;">Rezervacija potrjena!</h1>
                <p style="color:rgba(255,255,255,0.85);font-size:16px;margin:0;">Hvala, ${ime}. Vaša rezervacija je bila uspešno oddana.</p>
              </td>
            </tr>

            <!-- TELO -->
            <tr>
              <td style="padding:36px 40px;">

                <!-- Prenočišče -->
                <div style="background:#f8fafc;border-radius:16px;padding:20px 24px;margin-bottom:24px;border-left:4px solid #2563eb;">
                  <p style="font-size:12px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:1px;margin:0 0 6px;">🏠 Prenočišče</p>
                  <p style="font-size:22px;font-weight:800;color:#0f172a;margin:0;">${naziv}</p>
                </div>

                <!-- Datumi -->
                <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                  <tr>
                    <td width="48%" style="background:#eff6ff;border-radius:16px;padding:20px;text-align:center;">
                      <p style="font-size:11px;font-weight:700;color:#3b82f6;text-transform:uppercase;margin:0 0 6px;">📅 Prihod</p>
                      <p style="font-size:18px;font-weight:800;color:#0f172a;margin:0;">${formatirajDatum(prihod)}</p>
                    </td>
                    <td width="4%"></td>
                    <td width="48%" style="background:#f0fdfa;border-radius:16px;padding:20px;text-align:center;">
                      <p style="font-size:11px;font-weight:700;color:#14b8a6;text-transform:uppercase;margin:0 0 6px;">📅 Odhod</p>
                      <p style="font-size:18px;font-weight:800;color:#0f172a;margin:0;">${formatirajDatum(odhod)}</p>
                    </td>
                  </tr>
                </table>

                <!-- Statistike -->
                <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                  <tr>
                    <td width="31%" style="background:#f8fafc;border-radius:16px;padding:16px;text-align:center;">
                      <div style="font-size:28px;">🌙</div>
                      <p style="font-size:24px;font-weight:800;color:#0f172a;margin:4px 0 2px;">${noci}</p>
                      <p style="font-size:12px;color:#64748b;font-weight:600;margin:0;">Noči</p>
                    </td>
                    <td width="3%"></td>
                    <td width="31%" style="background:#f8fafc;border-radius:16px;padding:16px;text-align:center;">
                      <div style="font-size:28px;">👥</div>
                      <p style="font-size:24px;font-weight:800;color:#0f172a;margin:4px 0 2px;">${gostov}</p>
                      <p style="font-size:12px;color:#64748b;font-weight:600;margin:0;">Gostov</p>
                    </td>
                    <td width="3%"></td>
                    <td width="31%" style="background:#eff6ff;border-radius:16px;padding:16px;text-align:center;border:2px solid #bfdbfe;">
                      <div style="font-size:28px;">💰</div>
                      <p style="font-size:24px;font-weight:800;color:#2563eb;margin:4px 0 2px;">${parseFloat(cena).toFixed(2)} €</p>
                      <p style="font-size:12px;color:#64748b;font-weight:600;margin:0;">Skupaj</p>
                    </td>
                  </tr>
                </table>

                <!-- Opomba -->
                <div style="background:#fffbeb;border-radius:16px;padding:16px 20px;border:1px solid #fcd34d;margin-bottom:28px;">
                  <p style="font-size:14px;color:#92400e;margin:0;">
                    ℹ️ <strong>Opomba:</strong> Rezervacija ni zavezujoča. Brezplačna odpoved do 48 ur pred prihodom.
                    Lastnik prenočišča vas bo kmalu kontaktiral za potrditev.
                  </p>
                </div>

                <!-- ID rezervacije -->
                <p style="font-size:13px;color:#94a3b8;text-align:center;margin:0;">
                  Identifikacijska številka rezervacije: <strong>#${rezervacijaId}</strong>
                </p>

              </td>
            </tr>

            <!-- FOOTER -->
            <tr>
              <td style="background:#0f172a;padding:24px 40px;text-align:center;">
                <p style="color:rgba(255,255,255,0.5);font-size:13px;margin:0;">
                  © 2026 ✨ UniqueStays — Vse pravice pridržane
                </p>
              </td>
            </tr>

          </table>
        </td></tr>
      </table>
    </body>
    </html>
    `;

    await emailTransporter.sendMail({
        from: `"UniqueStays ✨" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
        to: email,
        subject: `✅ Rezervacija potrjena – ${naziv}`,
        html
    });
}

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
            .select('slika', 'ime_slike', 'cover', 'TK_prenocisce');

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
 
// Vrni sliko doživetja (javno)
app.get('/api/slika-dozivetja/:id', async (req, res) => {
    try {
        const slika = await db('Slika').where('TK_dozivetje', req.params.id).first();
        if (!slika || !slika.slika) return res.status(404).end();
        const ext = (slika.ime_slike || '').split('.').pop().toLowerCase();
        const mime = { png: 'image/png', gif: 'image/gif', webp: 'image/webp' }[ext] || 'image/jpeg';
        res.set('Content-Type', mime);
        res.set('Cache-Control', 'public, max-age=86400');
        res.send(slika.slika);
    } catch (err) {
        console.error(err);
        res.status(500).end();
    }
});
 
//Dodaj sliko doživetja (samo lastnik)
app.post(
    '/api/dozivetje/:id/slike',
    preveriToken,
    upload.array('slike', 20),
    async (req, res) => {
        try {
            const files = req.files || [];
 
            const dozivetje = await db('Dozivetje')
                .where('ID_dozivetje', req.params.id)
                .where('TK_uporabnik', req.uporabnik.id)
                .first();
 
            if (!dozivetje) {
                return res.status(404).json({ napaka: 'Ni najdeno.' });
            }
 
            await Promise.all(files.map(async (file) => {
                const buffer = fs.readFileSync(file.path);
 
                await db('Slika').insert({
                    slika: buffer,
                    ime_slike: file.filename,
                    cover: false,
                    TK_prenocisce: null,
                    TK_uporabnik: req.uporabnik.id,
                    TK_dozivetje: req.params.id
                });
 
                fs.unlinkSync(file.path);
            }));
 
            res.json({ uspeh: true });
 
        } catch (err) {
            console.error(err);
            res.status(500).json({ napaka: 'Upload error' });
        }
    }
);
//zbriši sliko doživetja (samo lastnik)
app.delete('/api/slika/:id', preveriToken, async (req, res) => {
    try {
        const slika = await db('Slika').where('ID_slika', req.params.id).first();
        if (!slika) return res.status(404).json({ napaka: 'Slika ne obstaja.' });
 
        //preveri lastništvo prek doživetja
        if (slika.TK_dozivetje) {
            const doz = await db('Dozivetje')
                .where('ID_dozivetje', slika.TK_dozivetje)
                .where('TK_uporabnik', req.uporabnik.id)
                .first();
            if (!doz) return res.status(403).json({ napaka: 'Nimate pravice.' });
        }
 
        if (!slika.TK_dozivetje && slika.ime_slike) {
        const pot = path.join(imagesDir, slika.ime_slike);
        if (fs.existsSync(pot)) fs.unlinkSync(pot);
    }
        await db('Slika').where('ID_slika', req.params.id).del();
        res.json({ uspeh: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ napaka: 'Napaka pri brisanju.' });
    }
});
 
//nove slike za doživetje
app.get('/api/dozivetje/:id/slike', async (req, res) => {
    const slike = await db('Slika').where('TK_dozivetje', req.params.id).select('ID_slika', 'ime_slike');
    res.json(slike);
});
 
app.get('/api/slika-dozivetja-id/:id', async (req, res) => {
    const slika = await db('Slika').where('ID_slika', req.params.id).first();
    if (!slika || !slika.slika) return res.status(404).end();
    res.set('Content-Type', 'image/jpeg');
    res.send(slika.slika);
});


//preveri ali je prijavljeni uporabnik upravicen do komentarja
app.get('/api/komentar/upravicen/:prenocisceId', preveriToken, async (req, res) => {
    try {
        const danes = new Date().toISOString().split('T')[0];
        const rezervacija = await db('Rezervacija')
            .where('TK_prenocisce', req.params.prenocisceId)
            .where('TK_uporabnik',  req.uporabnik.id)
            .where('rezervirano',   true)
            .where('datum_do', '<', db.raw('CURDATE()'))
            .first();
 
        const obstojeci = await db('Komentar')
            .where('TK_prenocisce', req.params.prenocisceId)
            .where('TK_uporabnik',  req.uporabnik.id)
            .first();
 
        const prenocisce = await db('Prenocisce')
            .where('ID_prenocisce', req.params.prenocisceId)
            .first();
        const jeLastnik = prenocisce && prenocisce.TK_uporabnik === req.uporabnik.id;
 
        res.json({
            upravicen:      !!rezervacija && !obstojeci,
            jeRezerviral:   !!rezervacija,
            jeZeKomentiral: !!obstojeci,
            jeLastnik
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ napaka: 'Napaka.' });
    }
});
 
//dodaj komentar (samo prijavljeni s pretečeno rezervacijo, enkrat na prenocisce)
app.post('/api/komentar', preveriToken, async (req, res) => {
    try {
        const { TK_prenocisce, komentar, ocena_splosna, ocena_udobje, ocena_unikatnost, ocena_lokacija, ocena_cenovna_ugodnost, ocena_dozivetje } = req.body;
 
        if (!TK_prenocisce || !ocena_splosna) {
            return res.status(400).json({ napaka: 'Manjkajo obvezni podatki.' });
        }
 
        const danes = new Date().toISOString().split('T')[0];
 
        const rezervacija = await db('Rezervacija')
            .where('TK_prenocisce', TK_prenocisce)
            .where('TK_uporabnik',  req.uporabnik.id)
            .where('rezervirano',   true)
            .where('datum_do', '<', danes)
            .first();
 
        if (!rezervacija) {
            return res.status(403).json({ napaka: 'Komentar lahko pustite samo po preteceni rezervaciji.' });
        }
 
        const prenocisce = await db('Prenocisce').where('ID_prenocisce', TK_prenocisce).first();
        if (prenocisce && prenocisce.TK_uporabnik === req.uporabnik.id) {
            return res.status(403).json({ napaka: 'Lastnik ne more oceniti svojega prenočišča.' });
        }
 
        const obstojeci = await db('Komentar')
            .where('TK_prenocisce', TK_prenocisce)
            .where('TK_uporabnik',  req.uporabnik.id)
            .first();
 
        if (obstojeci) {
            return res.status(409).json({ napaka: 'Za to prenocisce ste ze pustili oceno.' });
        }
 
        await db('Komentar').insert({
            komentar:               komentar || null,
            datum_komentar:         danes,
            ocena_splosna:          parseInt(ocena_splosna),
            ocena_udobje:           parseInt(ocena_udobje)           || 0,
            ocena_unikatnost:       parseInt(ocena_unikatnost)       || 0,
            ocena_lokacija:         parseInt(ocena_lokacija)         || 0,
            ocena_cenovna_ugodnost: parseInt(ocena_cenovna_ugodnost) || 0,
            ocena_dozivetje:        parseInt(ocena_dozivetje)        || 0,
            TK_uporabnik:           req.uporabnik.id,
            TK_prenocisce:          TK_prenocisce
        });
 
        res.status(201).json({ uspeh: true, sporocilo: 'Vasa ocena je bila shranjena.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ napaka: 'Napaka pri shranjevanju ocene.' });
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

        // Pošlji potrditveni email (asinhrono – ne blokira odgovora)
        try {
            const uporabnik = await db('Uporabnik')
                .where('ID_uporabnik', req.uporabnik.id)
                .select('ime_uporabnika', 'email')
                .first();

            if (uporabnik && uporabnik.email) {
                const noci = Math.round(
                    (new Date(datum_odhoda) - new Date(datum_prihoda)) / 86400000
                );
                const cena = noci * (prenocisce.cena_na_noc || 0);
                const gostov = req.body.stevilo_gostov || 1;

                posljiPotrditevRezervacije({
                    email:        uporabnik.email,
                    ime:          uporabnik.ime_uporabnika,
                    naziv:        prenocisce.naziv,
                    prihod:       datum_prihoda,
                    odhod:        datum_odhoda,
                    gostov,
                    noci,
                    cena,
                    rezervacijaId: id
                }).catch(err => console.error('⚠️  Email ni bil poslan:', err.message));
            }
        } catch (emailErr) {
            console.error('⚠️  Napaka pri pripravi emaila:', emailErr.message);
        }

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

//PRILJUBLJENO

//ali je prenocisce dodano v priljubleno (srcek)
app.get('/api/priljubljeno/:id', preveriToken, async (req, res) => {
    try {
        const vnos = await db('Priljubljeno')
            .where('TK_uporabnik', req.uporabnik.id)
            .where('TK_prenocisce', req.params.id)
            .first();
        res.json({ priljubljeno: !!vnos });
    } catch (err) {
        res.status(500).json({ napaka: 'Napaka.' });
    }
});

//dodaj oz odstrani iz priljubljeno (prodrobnosti.html)
app.post('/api/priljubljeno/:id', preveriToken, async (req, res) => {
    try {
        const obstoječe = await db('Priljubljeno')
            .where('TK_uporabnik', req.uporabnik.id)
            .where('TK_prenocisce', req.params.id)
            .first();
        if (obstoječe) {
            await db('Priljubljeno')
                .where('TK_uporabnik', req.uporabnik.id)
                .where('TK_prenocisce', req.params.id)
                .del();
            res.json({ priljubljeno: false });
        } else {
            await db('Priljubljeno').insert({
                datum: new Date().toISOString().split('T')[0],
                TK_uporabnik: req.uporabnik.id,
                TK_prenocisce: req.params.id
            });
            res.json({ priljubljeno: true });
        }
    } catch (err) {
        res.status(500).json({ napaka: 'Napaka.' });
    }
});

// pridobi podatke in vrne seznam priljubljenih prenočišč prijavljenega uporabnika
app.get('/api/priljubljeno', preveriToken, async (req, res) => {
    try {
        const priljubljena = await db('Priljubljeno')
            .join('Prenocisce', 'Priljubljeno.TK_prenocisce', 'Prenocisce.ID_prenocisce')
            .where('Priljubljeno.TK_uporabnik', req.uporabnik.id)
            .select(
                'Prenocisce.ID_prenocisce as id',
                'Prenocisce.naziv',
                'Prenocisce.cena_na_noc as cena'
            );

        res.json(priljubljena);
    } catch (err) {
        console.error(err);
        res.status(500).json({ napaka: 'Napaka pri pridobivanju priljubljenih.' });
    }
});

// izbrise prenočišče iz seznama priljubljenih (profil.html)
app.delete('/api/priljubljeno/:id', preveriToken, async (req, res) => {
    try {
        await db('Priljubljeno')
            .where('TK_uporabnik', req.uporabnik.id)
            .where('TK_prenocisce', req.params.id)
            .del();
        res.json({ uspeh: true });
    } catch (err) {
        res.status(500).json({ napaka: 'Napaka.' });
    }
});

// EMAIL - pošlje obvestilo o prekinitvi rezervacije
async function posljiPrekinitevRezervacije({ email, ime, naziv, prihod, odhod, rezervacijaId }) {
    const formatirajDatum = (str) => {
        const d = new Date(str);
        return d.toLocaleDateString('sl-SI', { day: 'numeric', month: 'long', year: 'numeric' });
    };

    const mailOptions = {
        from: `"UniqueStays" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: `Rezervacija #${rezervacijaId} je bila preklicana`,
        html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#f8fafc;border-radius:16px;overflow:hidden;">
            <div style="background:linear-gradient(135deg,#1e293b,#dc2626);padding:32px 40px;text-align:center;">
                <h1 style="color:white;font-size:28px;margin:0;font-weight:800;">✨ UniqueStays</h1>
                <p style="color:rgba(255,255,255,0.85);font-size:16px;margin:8px 0 0;">Vaša rezervacija je bila preklicana.</p>
            </div>
            <div style="padding:40px;">
                <p style="font-size:16px;color:#334155;">Pozdravljeni, <strong>${ime}</strong>,</p>
                <p style="font-size:15px;color:#475569;">Obveščamo vas, da je bila vaša rezervacija uspešno preklicana.</p>
                <div style="background:white;border-radius:12px;padding:24px;margin:24px 0;border:1px solid #e2e8f0;">
                    <h2 style="color:#1e293b;font-size:20px;margin:0 0 16px;">${naziv}</h2>
                    <table style="width:100%;border-collapse:collapse;">
                        <tr><td style="padding:8px 0;color:#64748b;font-size:14px;">Prihod</td><td style="padding:8px 0;font-weight:600;color:#1e293b;">${formatirajDatum(prihod)}</td></tr>
                        <tr><td style="padding:8px 0;color:#64748b;font-size:14px;">Odhod</td><td style="padding:8px 0;font-weight:600;color:#1e293b;">${formatirajDatum(odhod)}</td></tr>
                        <tr><td style="padding:8px 0;color:#64748b;font-size:14px;">ID rezervacije</td><td style="padding:8px 0;font-weight:600;color:#dc2626;">#${rezervacijaId}</td></tr>
                    </table>
                </div>
                <p style="font-size:14px;color:#94a3b8;margin-top:32px;">Ekipa UniqueStays</p>
            </div>
        </div>`
    };

    await emailTransporter.sendMail(mailOptions);
}

// REZERVACIJE - pridobi vse aktivne rezervacije prijavljenega uporabnika
app.get('/api/moje-rezervacije', preveriToken, async (req, res) => {
    try {
        const rezervacije = await db('Rezervacija')
            .join('Prenocisce', 'Rezervacija.TK_prenocisce', 'Prenocisce.ID_prenocisce')
            .where('Rezervacija.TK_uporabnik', req.uporabnik.id)
            .where('Rezervacija.rezervirano', true)
            .select(
                'Rezervacija.ID_rezervacija',
                'Rezervacija.datum_od',
                'Rezervacija.datum_do',
                'Rezervacija.datum_rezervacije',
                'Prenocisce.naziv',
                'Prenocisce.naslov',
                'Prenocisce.cena_na_noc'
            )
            .orderBy('Rezervacija.datum_od', 'desc');

        res.json(rezervacije);
    } catch (err) {
        console.error('Napaka pri pridobivanju rezervacij:', err);
        res.status(500).json({ napaka: 'Napaka pri pridobivanju rezervacij.' });
    }
});

// REZERVACIJA - preklic rezervacije (samo 48h pred prihodom)
app.delete('/api/rezervacija/:id', preveriToken, async (req, res) => {
    try {
        const rezervacija = await db('Rezervacija')
            .where('ID_rezervacija', req.params.id)
            .where('TK_uporabnik', req.uporabnik.id)
            .first();

        if (!rezervacija) {
            return res.status(404).json({ napaka: 'Rezervacija ni najdena.' });
        }

        // Preveri 48h pravilo
        const zdaj = new Date();
        const prihod = new Date(rezervacija.datum_od);
        const razlikaMs = prihod - zdaj;
        const razlikaUre = razlikaMs / (1000 * 60 * 60);

        if (razlikaUre < 48) {
            return res.status(403).json({
                napaka: 'Rezervacije ni mogoče preklicati manj kot 48 ur pred prihodom.'
            });
        }

        // Preklic - nastavi rezervirano na false
        await db('Rezervacija')
            .where('ID_rezervacija', req.params.id)
            .update({ rezervirano: false });

        // Pošlji email o preklicu
        try {
            const uporabnik = await db('Uporabnik')
                .where('ID_uporabnik', req.uporabnik.id)
                .select('ime_uporabnika', 'email')
                .first();

            const prenocisce = await db('Prenocisce')
                .where('ID_prenocisce', rezervacija.TK_prenocisce)
                .select('naziv')
                .first();

            if (uporabnik && uporabnik.email) {
                posljiPrekinitevRezervacije({
                    email: uporabnik.email,
                    ime: uporabnik.ime_uporabnika,
                    naziv: prenocisce ? prenocisce.naziv : 'Prenočišče',
                    prihod: rezervacija.datum_od,
                    odhod: rezervacija.datum_do,
                    rezervacijaId: req.params.id
                }).catch(err => console.error('⚠️  Email (preklic) ni bil poslan:', err.message));
            }
        } catch (emailErr) {
            console.error('⚠️  Napaka pri pošiljanju emaila (preklic):', emailErr.message);
        }

        res.json({ uspeh: true, sporocilo: 'Rezervacija je bila uspešno preklicana.' });
    } catch (err) {
        console.error('Napaka pri preklicu rezervacije:', err);
        res.status(500).json({ napaka: 'Napaka pri preklicu rezervacije.' });
    }
});

//email - povabilo k ocenjevanju/komentiranju
async function posljiPovabiloKOceni({ email, ime, naziv, datumOdhoda, prenocisceId }) { 
    const oceniUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/podrobnosti.html?id=${prenocisceId}#ocena`;
 
    const html = `
    <!DOCTYPE html>
    <html lang="sl">
    <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
    <body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 0;">
        <tr><td align="center">
          <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
 
            <tr>
              <td style="background:linear-gradient(135deg,#2563eb,#14b8a6);padding:40px 40px 32px;text-align:center;">
                <div style="font-size:40px;margin-bottom:10px;">✨</div>
                <h1 style="color:#ffffff;font-size:26px;font-weight:800;margin:0 0 6px;">Kako je bilo bivanje?</h1>
                <p style="color:rgba(255,255,255,0.85);font-size:15px;margin:0;">Vaše mnenje nam veliko pomeni</p>
              </td>
            </tr>
 
            <tr>
              <td style="padding:40px;">
                <p style="font-size:16px;color:#334155;margin:0 0 12px;">Pozdravljeni, <strong>${ime}</strong>!</p>
                <p style="font-size:15px;color:#475569;line-height:1.7;margin:0 0 28px;">
                  Vaše bivanje v <strong>${naziv}</strong> se je zaključilo <strong>${datumOdhoda}</strong>.
                  Upamo, da ste uživali! Vaša ocena pomaga drugim gostom pri odločitvi in lastniku prenočišča pri izboljšavah.
                </p>
 
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td align="center" style="padding:0 0 36px;">
                      <a href="${oceniUrl}"
                         style="display:inline-block;background:linear-gradient(135deg,#2563eb,#14b8a6);color:#ffffff;font-size:16px;font-weight:700;text-decoration:none;padding:16px 44px;border-radius:50px;box-shadow:0 4px 14px rgba(37,99,235,0.35);">
                        Oddajte oceno
                      </a>
                    </td>
                  </tr>
                </table>
 
                <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border-radius:12px;margin-bottom:28px;">
                  <tr>
                    <td style="padding:20px 24px;">
                      <p style="font-size:12px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 14px;">Kako oddati oceno?</p>
                      <p style="font-size:14px;color:#475569;margin:0 0 8px;">1. Kliknite gumb zgoraj</p>
                      <p style="font-size:14px;color:#475569;margin:0 0 8px;">2. Prijavite se v račun</p>
                      <p style="font-size:14px;color:#475569;margin:0;">3. Izpolnite obrazec z ocenami in komentarjem</p>
                    </td>
                  </tr>
                </table>
 
                <p style="font-size:13px;color:#94a3b8;margin:0;">
                  Ocenite lahko samo enkrat na bivanje. Hvala, ker ste del skupnosti UniqueStays.
                </p>
              </td>
            </tr>
 
            <tr>
              <td style="background:#f8fafc;padding:20px 40px;text-align:center;border-top:1px solid #e2e8f0;">
                <p style="font-size:13px;font-weight:700;color:#334155;margin:0 0 4px;">UniqueStays</p>
                <p style="font-size:12px;color:#94a3b8;margin:0;">2026 UniqueStays - Vse pravice pridrzane</p>
              </td>
            </tr>
 
          </table>
        </td></tr>
      </table>
    </body>
    </html>`;
 
    await emailTransporter.sendMail({
        from: `"UniqueStays" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: `Kako je bilo v ${naziv}? Oddajte oceno bivanja`,
        html
    });
}
 //pošlje povabilo k ocenjevanju/komentiranju prenočišča gostom, katerih rezervacija je potekla včeraj in še niso komentirali
const cron = require('node-cron');
 
cron.schedule('0 10 * * *', async () => {
    try {
 
        const rezervacije = await db('Rezervacija')
            .join('Uporabnik', 'Rezervacija.TK_uporabnik', 'Uporabnik.ID_uporabnik')
            .join('Prenocisce', 'Rezervacija.TK_prenocisce', 'Prenocisce.ID_prenocisce')
            .where('Rezervacija.rezervirano', true)
            .where('Rezervacija.povabilo_poslano', false)
            .where('Rezervacija.datum_do', '<', db.raw('CURDATE()'))
            .whereNotExists(function () {
                this.select('*').from('Komentar')
                    .whereRaw('Komentar.TK_uporabnik = Rezervacija.TK_uporabnik')
                    .whereRaw('Komentar.TK_prenocisce = Rezervacija.TK_prenocisce');
            })
            .select(
                'Rezervacija.ID_rezervacija',
                'Uporabnik.email',
                'Uporabnik.ime_uporabnika as ime',
                'Prenocisce.naziv',
                'Prenocisce.ID_prenocisce as prenocisceId',
                'Rezervacija.datum_do as datumOdhoda'
            );
 
        for (const r of rezervacije) {
            if (!r.email) continue;
            try {
                const datumFormatiran = new Date(r.datumOdhoda).toLocaleDateString('sl-SI', {
                    day: 'numeric', month: 'long', year: 'numeric'
                });
                await posljiPovabiloKOceni({
                    email: r.email,
                    ime: r.ime,
                    naziv: r.naziv,
                    datumOdhoda: datumFormatiran,
                    prenocisceId: r.prenocisceId
                });
                await db('Rezervacija')
                    .where('ID_rezervacija', r.ID_rezervacija)
                    .update({
                        povabilo_poslano: true
                    });
            } catch (err) {
                console.error(`  Napaka za ${r.email}:`, err.message);
            }
        }
    } catch (err) {
        console.error('Cron napaka:', err.message);
    }
});

// Zagon strežnika
app.listen(PORT, () => {
    console.log(`Server teče na http://localhost:${PORT}`);
});