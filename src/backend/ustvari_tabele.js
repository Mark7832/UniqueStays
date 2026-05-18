console.log('Skripta se je zagnala');
const knex = require('knex')({
    client: 'mysql2' ,
    connection: {
        host: '127.0.0.1',
        user: 'root',
        password: 'geslo',
        database: 'uniquestays'
    }
});

async function napolniBazo() {
    try {

        await knex.schema.dropTableIfExists('Komentar');
        await knex.schema.dropTableIfExists('Priljubljeno');
        await knex.schema.dropTableIfExists('Sporocila');
        await knex.schema.dropTableIfExists('Slika');
        await knex.schema.dropTableIfExists('Dozivetje');
        await knex.schema.dropTableIfExists('Rezervacija');
        await knex.schema.dropTableIfExists('Nerazpolozljiv_termin');
        await knex.schema.dropTableIfExists('Prenocisce');
        await knex.schema.dropTableIfExists('Uporabnik');
        
    // UPORABNIK
        await knex.schema.createTable('Uporabnik' , (table) => {
            table.increments('ID_uporabnik');
            table.string('ime_uporabnika').notNullable();
            table.string('priimek_uporabnika').notNullable();
            table.string('email').notNullable();
            table.string('geslo').notNullable();
            table.string('opis');
            table.date('ustvarjen_od').notNullable();
        });

        console.log('Tabela uporabnik uspesno ustvarjena.');

        const Uporabnik = [
            {ime_uporabnika: 'Jože', priimek_uporabnika: 'Krajnc', email: 'joze@gmail.com', geslo: 'geslo123', ustvarjen_od: '2024-01-15' },
            {ime_uporabnika: 'Meta', priimek_uporabnika: 'Bezeg', email: 'meta@gmail.com', geslo: 'mocno_geslo', ustvarjen_od: '2024-01-15' },
            {ime_uporabnika: 'Luka', priimek_uporabnika: 'Horvat', email: 'luka@gmail.com', geslo: 'luka456', ustvarjen_od: '2024-03-10'},
            {ime_uporabnika: 'Ana', priimek_uporabnika: 'Novak', email: 'ana@gmail.com', geslo: 'ana789', ustvarjen_od: '2024-03-22'},
            {ime_uporabnika: 'Tina', priimek_uporabnika: 'Zupan', email: 'tina@gmail.com', geslo: 'tina321', ustvarjen_od: '2024-04-05'},
            {ime_uporabnika: 'Marko', priimek_uporabnika: 'Kovač', email: 'marko@gmail.com', geslo: 'marko654', ustvarjen_od: '2024-04-18'},
            {ime_uporabnika: 'Nina', priimek_uporabnika: 'Potočnik', email: 'nina@gmail.com', geslo: 'nina987', ustvarjen_od: '2024-05-01'},
            {ime_uporabnika: 'Rok', priimek_uporabnika: 'Mlinar', email: 'rok@gmail.com', geslo: 'rok111', ustvarjen_od: '2024-05-15'},
            {ime_uporabnika: 'Petra', priimek_uporabnika: 'Mlakar', email: 'petra@gmail.com', geslo: 'petra222', ustvarjen_od: '2024-06-01'},
            {ime_uporabnika: 'Urh', priimek_uporabnika: 'Vidmar', email: 'urh28@gmail.com', geslo: 'urh333', ustvarjen_od: '2024-06-10'}
        ];

        await knex('Uporabnik').insert(Uporabnik); //funkcija ki podatke vnese v tebelo

        console.log('Uporabniki uspesno dodani.');


    // PRENOCISCE
        await knex.schema.createTable('Prenocisce' , (table) => {
            table.increments('ID_prenocisce');
            table.string('naziv').notNullable();
            table.string('tip_prenocisca').notNullable();
            table.string('opis_prenocisca').notNullable();
            table.decimal('cena_na_noc', 6, 2);
            table.string('koordinate', 50).notNullable();
            table.string('naslov').notNullable();
            table.integer('TK_uporabnik').unsigned().references('ID_uporabnik').inTable('Uporabnik');
        });

        console.log('Tabela prenocisce ustvarjena.');

        const Prenocisce = [
            { naziv: 'Alpine Ski Lodge',
              tip_prenocisca: 'Gorska koča',
              opis_prenocisca: 'Koča obdana s prečudovitim razgledom na zasnežene gorske vrhove, zasebno savno in idealno lokacijo blizu večjih smučišč.',
              cena_na_noc: 180,
              koordinate: '46.8182,8.2275',
              naslov: 'Zermatt, Švica',
              TK_uporabnik: 1
            },

            { naziv: 'Predjamski grad',
              tip_prenocisca: 'Grad',
              opis_prenocisca: 'Predjamski grad, vklesan v mogočno skalno steno, ponuja pravljično doživetje s pridihom zgodovine, skrivnostnih rovov in čudovitega razgleda na kraško pokrajino.',
              cena_na_noc: 230,
              koordinate: '45.8150,14.1279',
              naslov: 'Predjama 1, Postojna, Slovenija',
              TK_uporabnik: 2
            },

            { naziv: 'Aurora Bubble Lodge',
              tip_prenocisca: 'Steklena kupola / glamping',
              opis_prenocisca: 'Prosojna ogrevana kupola sredi islandske narave ponuja čarobno noč pod zvezdami in severnim sijem, idealno za romantičen pobeg v tišini gozda.',
              cena_na_noc: 310,
              koordinate: '64.9631,-19.0208',
              naslov: 'Hella, Islandija',
              TK_uporabnik: 3
            },

            { naziv: 'Cave Hideaway',
              tip_prenocisca: 'Jama',
               opis_prenocisca: 'Prespite v skrivnostni jami z mehko svetlobo lantern, naravno hladnim zrakom in občutkom, kot da ste odkrili skriti svet pod zemljo.',
               cena_na_noc: 167,
               koordinate: '8.6431,34.8270',
               naslov: 'Göreme, Kapakodija, Turčija',
               TK_uporabnik: 4
            },

            { naziv: 'Jungle Treehouse Hideaway',
              tip_prenocisca: 'Drevesna hišica',
              opis_prenocisca: 'Drevesna hišica sredi kostariške džungle, kjer vas zjutraj zbudijo tropske ptice, zvečer pa uspava zvok dežja med krošnjami.',
              cena_na_noc: 420,
              koordinate: '9.7489,-83.7534',
              naslov: 'Monteverde, Kostarika',
              TK_uporabnik: 5
            },

            { naziv: 'Under the sea hotel',
              tip_prenocisca: 'Vila pod vodo',
              opis_prenocisca: 'Podvodni hotel na Maldivih ponuja nepozabno spanje med koralnimi grebeni, kjer skozi steklene stene opazujete pisane ribe, morske želve in čarobni svet oceana, kar iz udobja svoje sobe.',
              cena_na_noc: 333,
              koordinate: '3.2028,73.2207',
               naslov: 'Male Atoll, Maldivi',
              TK_uporabnik: 6
            },

            { naziv: 'Quack & Coffee Houseboat',
              tip_prenocisca: 'Barka',
              opis_prenocisca: 'Majhna plavajoča hiška na mirni reki, kjer vas zjutraj namesto alarma zbudijo račke, valovi in vonj sveže kave.',
              cena_na_noc: 140,
               koordinate: '52.3676,4.9041',
              naslov: 'Amsterdam Center, Nizozemska',
              TK_uporabnik: 7
            },

            { naziv: 'Sleepy Train Carriage',
              tip_prenocisca: 'Prenovljen star vagon',
              opis_prenocisca: 'Prespite v vintage vagonu, kjer notranjost izgleda kot potovanje v preteklost, zunaj pa vas čaka mirna narava.',
              cena_na_noc: 210,
              koordinate: '46.2276,2.2137',
              naslov: 'Lyon, Francija',
              TK_uporabnik: 8
            },

            { naziv: 'Mushroom Forest Hut',
              tip_prenocisca: 'Pravljična gozdna hiška',
              opis_prenocisca: 'Majhna okrogla hiška med drevesi, ki izgleda kot iz pravljice, z mehko svetlobo in vonjem po gozdu.',
              cena_na_noc: 90,
              koordinate: '-40.9006,174.8860',
              naslov: 'Rotorua, Nova Zelandija',
              TK_uporabnik: 9
            }
        ];

        await knex('Prenocisce').insert(Prenocisce);

        console.log('Prenocisca uspesno dodana.');

    // NERAZPOLOZLJIV TERMIN
        await knex.schema.createTable('Nerazpolozljiv_termin' , (table) => {
            table.increments('ID_nerazpolozljiv_termin');
            table.string('razlog').notNullable();
            table.date('datum_od').notNullable();
            table.date('datum_do').notNullable();
            table.integer('TK_prenocisce').unsigned().references('ID_prenocisce').inTable('Prenocisce');
        });

        console.log('Tabela nerazpolozljiv termin uspesno ustvarjena.');
       
        const Nerazpolozljiv_termin = [
            {razlog: 'Zasebna prireditev', datum_od: '2024-06-01', datum_do: '2024-06-05', TK_prenocisce: 2},
            {razlog: 'Vzdrževanje objekta', datum_od: '2024-07-10', datum_do: '2024-07-15', TK_prenocisce: 7},
            {razlog: 'Sezonsko zaprtje', datum_od: '2024-12-01', datum_do: '2024-12-31', TK_prenocisce: 4},
            {razlog: 'Popravila po nevihti', datum_od: '2024-08-05', datum_do: '2024-08-08', TK_prenocisce: 3},
            {razlog: 'Dopust', datum_od: '2024-09-20', datum_do: '2024-09-30', TK_prenocisce: 1}
        ];

        await knex('Nerazpolozljiv_termin').insert(Nerazpolozljiv_termin);

        console.log('Nerazpolozljivi termini uspesno dodani.');

    // REZERVACIJA
        await knex.schema.createTable('Rezervacija', (table) => {
            table.increments('ID_rezervacija');
            table.date('datum_od').notNullable();
            table.date('datum_do').notNullable();
            table.date('datum_rezervacije').notNullable();
            table.boolean('rezervirano').notNullable();
            table.integer('TK_uporabnik').unsigned().references('ID_uporabnik').inTable('Uporabnik');
            table.integer('TK_prenocisce').unsigned().references('ID_prenocisce').inTable('Prenocisce');
        });

        console.log('Tabela Rezervacija uspesno ustvarjena.');

        const Rezervacija = [
            {datum_od: '2024-06-10', datum_do: '2024-06-15', datum_rezervacije: '2024-05-01', rezervirano: true, TK_uporabnik: 1, TK_prenocisce: 1},
            {datum_od: '2024-07-01', datum_do: '2024-07-07', datum_rezervacije: '2024-06-01', rezervirano: true, TK_uporabnik: 2, TK_prenocisce: 2},
            {datum_od: '2024-08-10', datum_do: '2024-08-14', datum_rezervacije: '2024-07-20', rezervirano: true, TK_uporabnik: 3, TK_prenocisce: 3},
            {datum_od: '2024-09-05', datum_do: '2024-09-10', datum_rezervacije: '2024-08-15', rezervirano: false, TK_uporabnik: 4, TK_prenocisce: 4},
            {datum_od: '2024-10-01', datum_do: '2024-10-05', datum_rezervacije: '2024-09-01', rezervirano: true, TK_uporabnik: 5, TK_prenocisce: 5},
            {datum_od: '2024-06-20', datum_do: '2024-06-25', datum_rezervacije: '2024-05-15', rezervirano: true, TK_uporabnik: 6, TK_prenocisce: 6},
            {datum_od: '2024-07-10', datum_do: '2024-07-14', datum_rezervacije: '2024-06-20', rezervirano: true, TK_uporabnik: 7, TK_prenocisce: 7},
            {datum_od: '2024-07-20', datum_do: '2024-07-25', datum_rezervacije: '2024-06-25', rezervirano: false, TK_uporabnik: 8, TK_prenocisce: 8},
            {datum_od: '2024-08-01', datum_do: '2024-08-05', datum_rezervacije: '2024-07-01', rezervirano: true, TK_uporabnik: 9, TK_prenocisce: 9},
            {datum_od: '2024-08-15', datum_do: '2024-08-20', datum_rezervacije: '2024-07-10', rezervirano: true, TK_uporabnik: 1, TK_prenocisce: 3},
            {datum_od: '2024-09-01', datum_do: '2024-09-05', datum_rezervacije: '2024-08-01', rezervirano: true, TK_uporabnik: 2, TK_prenocisce: 5},
            {datum_od: '2024-09-15', datum_do: '2024-09-20', datum_rezervacije: '2024-08-20', rezervirano: false, TK_uporabnik: 3, TK_prenocisce: 7},
            {datum_od: '2024-10-10', datum_do: '2024-10-15', datum_rezervacije: '2024-09-10', rezervirano: true, TK_uporabnik: 4, TK_prenocisce: 2},
            {datum_od: '2024-10-20', datum_do: '2024-10-25', datum_rezervacije: '2024-09-15', rezervirano: true, TK_uporabnik: 5, TK_prenocisce: 4},
            {datum_od: '2024-11-01', datum_do: '2024-11-05', datum_rezervacije: '2024-10-01', rezervirano: false, TK_uporabnik: 6, TK_prenocisce: 1},
            {datum_od: '2024-11-10', datum_do: '2024-11-15', datum_rezervacije: '2024-10-10', rezervirano: true, TK_uporabnik: 7, TK_prenocisce: 6},
            {datum_od: '2024-11-20', datum_do: '2024-11-25', datum_rezervacije: '2024-10-20', rezervirano: true, TK_uporabnik: 8, TK_prenocisce: 3},
            {datum_od: '2024-12-01', datum_do: '2024-12-05', datum_rezervacije: '2024-11-01', rezervirano: true, TK_uporabnik: 9, TK_prenocisce: 8},
            {datum_od: '2024-12-10', datum_do: '2024-12-15', datum_rezervacije: '2024-11-10', rezervirano: false, TK_uporabnik: 1, TK_prenocisce: 9},
            {datum_od: '2024-12-20', datum_do: '2024-12-27', datum_rezervacije: '2024-11-20', rezervirano: true, TK_uporabnik: 2, TK_prenocisce: 4}
        ];

        await knex('Rezervacija').insert(Rezervacija);

        console.log('Rezervacije uspesno dodane.');

    // DOZIVETJE
        await knex.schema.createTable('Dozivetje', (table) => {
            table.increments('ID_dozivetje');
            table.string('naziv').notNullable();
            table.string('opis').notNullable();
            table.decimal('doplacilo', 6, 2).notNullable();
            table.integer('TK_prenocisce').unsigned().references('ID_prenocisce').inTable('Prenocisce');
            table.integer('TK_rezervacija').unsigned().references('ID_rezervacija').inTable('Rezervacija');
        });

        console.log('Tabela Dozivetje uspesno ustvarjena.');
        
        const Dozivetje = [
            { naziv:'Zasebna wellness noč',
              opis:'Večerni dostop do zasebne savne in jacuzzija s pogledom na zasnežene Alpe.',
              doplacilo:59.99,
              TK_prenocisce: 1,
              TK_rezervacija: 1
            },

            { naziv:'Nočno sankanje',
              opis:'Sankanje pod zvezdami.',
              doplacilo:14.99,
              TK_prenocisce: 1,
              TK_rezervacija: 2 
            },

            { naziv:'Raziskovanje skrivnih rovov',
              opis:'Ekskluziven ogled podzemnih rovov in skrivnih prehodov pod Predjamskim gradom.',
              doplacilo:34.99,
              TK_prenocisce: 2,
              TK_rezervacija: 3
            },

            {  naziv:'Viteška večerja',
              opis:'Večerja ob svečah v grajski dvorani z viteškim menijem in srednjeveško glasbo.',
              doplacilo: 52.99,
              TK_prenocisce: 2,
              TK_rezervacija: 4
            },

            { naziv:'Lov na severni sij',     
              opis:'Nočni izlet z vodičem za opazovanje severnega sija daleč od mestnih luči.',
              doplacilo: 99.99,
              TK_prenocisce: 3,
              TK_rezervacija: 5
            },

            { naziv:'Zajtrk pod zvezdami',
              opis:'Romantičen islandski zajtrk postrežen neposredno ob stekleni kupoli.',
              doplacilo:'24.99',
              TK_prenocisce: 3,
              TK_rezervacija: 6
            },

            { naziv:'Večer ob lanternah',
              opis:'Posebna večerja v jami ob lanternah in tradicionalni turški glasbi.',
              doplacilo: 36.99,
              TK_prenocisce: 4,
              TK_rezervacija: 7
            },

            { naziv:'Polet balonov nad Kapadokijo',
              opis:'Jutranji polet z balonom nad znamenitimi skalnimi formacijami Kapadokije.',
              doplacilo: 139.99,
              TK_prenocisce: 4,
              TK_rezervacija: 8
            },

            { naziv:'Nočni sprehod po džungli',
              opis:'Voden sprehod po tropski džungli z opazovanjem nočnih živali.',
              doplacilo: 55.99,
              TK_prenocisce: 5,
              TK_rezervacija: 9
            },

            { naziv:'Joga med krošnjami',
              opis:'Jutranja joga na panoramski terasi visoko med drevesnimi krošnjami.',
              doplacilo: 29.99,
              TK_prenocisce: 5,
              TK_rezervacija: 10
            },

            { naziv:'Plavanje z morskimi psi',
              opis:'Organizirano snorklanje med koralnimi grebeni in morskimi psi.',
              doplacilo: 74.99,
              TK_prenocisce: 6,
              TK_rezervacija: 11
            },

            { naziv:'Podvodno fotografiranje',
              opis:'Profesionalno fotografiranje med raziskovanjem podvodnega sveta.',
              doplacilo: 110,
              TK_prenocisce: 6,
              TK_rezervacija: 12
            },

            { naziv:'Nočno snorklanje z modro svetlečim planktonom',
              opis:'',
              doplacilo: 89.99,
              TK_prenocisce: 6,
              TK_rezervacija: 13
            },

            { naziv:'Plavajoči zajtrk',
              opis:'Svež zajtrk postrežen na leseni plavajoči mizi ob sončnem vzhodu.',
              doplacilo:15.99,
              TK_prenocisce: 7,
              TK_rezervacija: 14
            },

            { naziv: 'Escape room Orient Express',
              opis: 'Interaktivna skrivnostna igra pobega v stilu stare železnice.',
              doplacilo: 34.99,
              TK_prenocisce: 8,
              TK_rezervacija: 15
            },

            { naziv: 'Večer čarobnih lantern',
              opis: 'Nočni sprehod skozi osvetljen gozd z lebdečimi lanternami.',
              doplacilo: 22.99,
              TK_prenocisce: 9,
              TK_rezervacija: 16
            }
        ];

        await knex('Dozivetje').insert(Dozivetje);

        console.log('Dozivjetja uspesno dodana.');

    // SLIKE
        await knex.schema.createTable('Slika', (table) => {
            table.increments('ID_slika');
            table.string('pot_slike')
            table.boolean('cover').defaultTo(false);
            table.integer('TK_uporabnik').unsigned().references('ID_uporabnik').inTable('Uporabnik');
            table.integer('TK_prenocisce').unsigned().references('ID_prenocisce').inTable('Prenocisce');
            table.integer('TK_dozivetje').unsigned().references('ID_dozivetje').inTable('Dozivetje');
        });

        console.log('Tabela Slika uspesno ustvarjena.');

        const Slika = [
            {   pot_slike:'/images/svica.jpg',
                cover: true,
                TK_prenocisce: 1
            },

            {   pot_slike:'/images/slovenija.jpg',
                cover: true,
                TK_prenocisce: 2
            },

            {   pot_slike:'/images/predjama.png',
                cover: false,
                TK_prenocisce: 2
            },

            {   pot_slike:'/images/kraljeva.png',
                cover: false,
                TK_prenocisce: 2
            },

            {   pot_slike:'/images/stolpna.png',
                cover: false,
                TK_prenocisce: 2
            },

            {   pot_slike:'/images/viteska.png',
                cover: false,
                TK_prenocisce: 2
            },

            {   pot_slike:'/images/islandija.jpg',
                cover: true,
                TK_prenocisce: 3
            },

            {   pot_slike:'/images/islandija-hotel.jpg',
                cover: true,
                TK_prenocisce: 3
            },

            {   pot_slike:'/images/jama.jpg',
                cover: true,
                TK_prenocisce: 4
            },

            {   pot_slike:'/images/kostarika.jpg',
                cover: true,
                TK_prenocisce: 5
            },

            {   pot_slike:'/images/maldivi.jpg',
                cover: true,
                TK_prenocisce: 6
            },

            {   pot_slike:'/images/amsterdam.jpg',
                cover: true,
                TK_prenocisce: 7
            },

            {   pot_slike:'/images/vlak.jpg',
                cover: true,
                TK_prenocisce: 8
            },

            {   pot_slike:'/images/mushroom.jpg',
                cover: true,
                TK_prenocisce: 9
            },

            
        ];

        await knex('Slika').insert(Slika);

        console.log('Slike uspesno dodane.');

    // SPOROCILA
        await knex.schema.createTable('Sporocila', (table) => {
            table.increments('ID_sporocila');
            table.string('vprasanje').notNullable();
            table.string('odgovor');
            table.date('datum_sporocila').notNullable();
            table.integer('TK_uporabnik').unsigned().references('ID_uporabnik').inTable('Uporabnik');
            table.integer('TK_prenocisce').unsigned().references('ID_prenocisce').inTable('Prenocisce');
        });

        console.log('Tabela Sporocila uspesno ustvarjena.');

        const Sporocila = [
            {vprasanje: 'Ali je parkirišče brezplačno?', odgovor: 'Da, parkirišče je brezplačno za vse goste.', datum_sporocila: '2024-05-10', TK_uporabnik: 1, TK_prenocisce: 1},
            {vprasanje: 'Ali so hišni ljubljenčki dovoljeni?', odgovor: 'Žal hišnih ljubljenčkov ne sprejemamo.', datum_sporocila: '2024-05-15', TK_uporabnik: 2, TK_prenocisce: 9},
            {vprasanje: 'Kdaj je možen zgodnji prihod?', odgovor: 'Zgodnji prihod je možen od 10:00 dalje po dogovoru.', datum_sporocila: '2024-06-01', TK_uporabnik: 3, TK_prenocisce: 3},
            {vprasanje: 'Ali je na voljo WiFi?', odgovor: 'Da, na voljo je brezplačen WiFi.', datum_sporocila: '2024-06-10', TK_uporabnik: 4, TK_prenocisce: 5}, 
            {vprasanje: 'Ali je možna brezplacna odpoved rezervacije?', odgovor: 'Brezplačna odpoved je možna do 7 dni pred prihodom.', datum_sporocila: '2024-06-20', TK_uporabnik: 5, TK_prenocisce: 5}
        ];

        await knex('Sporocila').insert(Sporocila);

        console.log('Sporocila uspesno dodana.');

    // PRILJUBLJENO
        await knex.schema.createTable('Priljubljeno', (table) => {
            table.increments('ID_priljubljeno');
            table.date('datum').notNullable();
            table.integer('TK_uporabnik').unsigned().references('ID_uporabnik').inTable('Uporabnik');
            table.integer('TK_prenocisce').unsigned().references('ID_prenocisce').inTable('Prenocisce');
        });

        console.log('Tabela Priljubljeno uspesno ustvarjena.');

        const Priljubljeno = [
            {datum: '2024-05-01', TK_uporabnik: 1, TK_prenocisce: 2},
            {datum: '2024-05-10', TK_uporabnik: 2, TK_prenocisce: 3},
            {datum: '2024-05-15', TK_uporabnik: 3, TK_prenocisce: 1},
            {datum: '2024-06-01', TK_uporabnik: 4, TK_prenocisce: 5},
            {datum: '2024-06-10', TK_uporabnik: 5, TK_prenocisce: 4}
        ];

        await knex('Priljubljeno').insert(Priljubljeno);

        console.log('Priljubljeno uspesno dodano.');

    // KOMENTAR
        await knex.schema.createTable('Komentar', (table) => {
            table.increments('ID_komentar');
            table.string('komentar');                                    
            table.date('datum_komentar').notNullable();
            table.integer('ocena_splosna').notNullable();
            table.integer('ocena_udobje').notNullable();
            table.integer('ocena_unikatnost').notNullable();
            table.integer('ocena_lokacija').notNullable();
            table.integer('ocena_cenovna_ugodnost').notNullable();
            table.integer('ocena_dozivetje').notNullable();
            table.integer('TK_uporabnik').unsigned().references('ID_uporabnik').inTable('Uporabnik');
            table.integer('TK_prenocisce').unsigned().references('ID_prenocisce').inTable('Prenocisce');
        });

        console.log('Tabela Komentar uspesno ustvarjena.');

        const Komentar = [
            {datum_komentar: '2024-06-20', ocena_splosna: 5, ocena_udobje: 4, ocena_unikatnost: 5, ocena_lokacija: 5, ocena_cenovna_ugodnost: 3, ocena_dozivetje: 5, TK_uporabnik: 1, TK_prenocisce: 1},
            {komentar: 'Severni sij iz igluja je bil magičen prizor.', datum_komentar: '2024-07-15', ocena_splosna: 5, ocena_udobje: 4, ocena_unikatnost: 5, ocena_lokacija: 5, ocena_cenovna_ugodnost: 2, ocena_dozivetje: 5, TK_uporabnik: 2, TK_prenocisce: 3},
            {komentar: 'Drevesna hiška romantična, malo hladna ponoči.', datum_komentar: '2024-08-20', ocena_splosna: 4, ocena_udobje: 3, ocena_unikatnost: 4, ocena_lokacija: 4, ocena_cenovna_ugodnost: 4, ocena_dozivetje: 3, TK_uporabnik: 3, TK_prenocisce: 5},
            {komentar: 'Spanje med koralnimi grebeni je bilo kot iz sanj, ribe so plavale tik ob postelji.', datum_komentar: '2024-09-15', ocena_splosna: 5, ocena_udobje: 5, ocena_unikatnost: 5, ocena_lokacija: 5, ocena_cenovna_ugodnost: 3, ocena_dozivetje: 4, TK_uporabnik: 4, TK_prenocisce: 6},
            {komentar: 'Podzemna soba hladna ampak super unikatna izkušnja.', datum_komentar: '2024-10-10', ocena_splosna: 4, ocena_udobje: 3, ocena_unikatnost: 5, ocena_lokacija: 4, ocena_cenovna_ugodnost: 4, ocena_dozivetje: 3, TK_uporabnik: 5, TK_prenocisce: 4}
        ];

        await knex('Komentar').insert(Komentar);

        console.log('Komentarji uspesno dodani.');

    } catch(err) {
        console.log('Err', err);
        throw err;
    } finally {
        knex.destroy();
    }
    
}

napolniBazo();