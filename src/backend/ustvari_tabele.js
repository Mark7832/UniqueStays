console.log('Skripta se je zagnala');
require('dotenv').config();
const knex = require('knex')({
    client: 'mysql2',
    connection: {
        host: process.env.DB_HOST || '127.0.0.1',
        port: parseInt(process.env.DB_PORT) || 3306,
        user: process.env.DB_USER || 'uniquestays',
        password: process.env.DB_PASSWORD || 'geslo',
        database: process.env.DB_NAME || 'uniquestays'
    }
});
const bcrypt = require('bcryptjs');

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
        
    // UPORABNIK - dodano je_admin polje
        await knex.schema.createTable('Uporabnik', (table) => {
            table.increments('ID_uporabnik');
            table.string('ime_uporabnika').notNullable();
            table.string('priimek_uporabnika').notNullable();
            table.string('email').notNullable();
            table.string('drzava').notNullable();
            table.string('geslo').notNullable();
            table.string('opis');
            table.boolean('je_admin').defaultTo(false); // NOVO - določa ali je user admin
            table.date('ustvarjen_od').notNullable();
            table.specificType('profilna_slika', 'LONGBLOB');
        });

        console.log('Tabela Uporabnik uspesno ustvarjena.');

        const Uporabnik = [
            // je_admin: true - ta user ima admin pravice in lahko odgovarja na sporočila
            { ime_uporabnika: 'Jože', priimek_uporabnika: 'Krajnc', email: 'joze@gmail.com', drzava: 'Italija', geslo: await bcrypt.hash('geslo123', 10), je_admin: true, ustvarjen_od: '2024-01-15' },
            { ime_uporabnika: 'Meta', priimek_uporabnika: 'Bezeg', email: 'meta@gmail.com', drzava: 'Slovenija', geslo: await bcrypt.hash('mocno_geslo', 10), je_admin: false, ustvarjen_od: '2024-01-15' },
            { ime_uporabnika: 'Luka', priimek_uporabnika: 'Horvat', email: 'luka@gmail.com', drzava: 'Italija', geslo: await bcrypt.hash('luka456', 10), je_admin: false, ustvarjen_od: '2024-03-10' },
            { ime_uporabnika: 'Ana', priimek_uporabnika: 'Novak', email: 'ana@gmail.com', drzava: 'Slovenija', geslo: await bcrypt.hash('ana789', 10), je_admin: false, ustvarjen_od: '2024-03-22' },
            { ime_uporabnika: 'Tina', priimek_uporabnika: 'Zupan', email: 'tina@gmail.com', drzava: 'Avstrija', geslo: await bcrypt.hash('tina321', 10), je_admin: false, ustvarjen_od: '2024-04-05' },
            { ime_uporabnika: 'Marko', priimek_uporabnika: 'Kovač', email: 'marko@gmail.com', drzava: 'Slovenija', geslo: await bcrypt.hash('marko654', 10), je_admin: false, ustvarjen_od: '2024-04-18' },
            { ime_uporabnika: 'Nina', priimek_uporabnika: 'Potočnik', email: 'nina@gmail.com', drzava: 'Italija', geslo: await bcrypt.hash('nina987', 10), je_admin: false, ustvarjen_od: '2024-05-01' },
            { ime_uporabnika: 'Rok', priimek_uporabnika: 'Mlinar', email: 'rok@gmail.com', drzava: 'Avstrija', geslo: await bcrypt.hash('rok111', 10), je_admin: false, ustvarjen_od: '2024-05-15' },
            { ime_uporabnika: 'Petra', priimek_uporabnika: 'Mlakar', email: 'petra@gmail.com', drzava: 'Nemčija', geslo: await bcrypt.hash('petra222', 10), je_admin: false, ustvarjen_od: '2024-06-01' },
            { ime_uporabnika: 'Urh', priimek_uporabnika: 'Vidmar', email: 'uniquestaystest@gmail.com', drzava: 'Slovenija', geslo: await bcrypt.hash('geslo123', 10), je_admin: false, ustvarjen_od: '2024-06-10' },
            { ime_uporabnika: 'Maja', priimek_uporabnika: 'Kovač', email: 'maja@gmail.com', drzava: 'Slovenija', geslo: await bcrypt.hash('maja123', 10), je_admin: false, ustvarjen_od: '2024-07-01' },
            { ime_uporabnika: 'Filip', priimek_uporabnika: 'Zorman', email: 'filip@gmail.com', drzava: 'Hrvaška', geslo: await bcrypt.hash('filip123', 10), je_admin: false, ustvarjen_od: '2024-08-15' },
            { ime_uporabnika: 'Sara', priimek_uporabnika: 'Blatnik', email: 'sara@gmail.com', drzava: 'Avstrija', geslo: await bcrypt.hash('sara123', 10), je_admin: false, ustvarjen_od: '2024-09-01' },
            { ime_uporabnika: 'Gregor', priimek_uporabnika: 'Petek', email: 'gregor@gmail.com', drzava: 'Nemčija', geslo: await bcrypt.hash('gregor123', 10), je_admin: false, ustvarjen_od: '2024-10-10' },
            { ime_uporabnika: 'Eva', priimek_uporabnika: 'Hrovat', email: 'eva@gmail.com', drzava: 'Italija', geslo: await bcrypt.hash('eva123', 10), je_admin: false, ustvarjen_od: '2024-11-05' },
        ];

        await knex('Uporabnik').insert(Uporabnik);
        console.log('Uporabniki uspesno dodani.');

    // PRENOCISCE
        await knex.schema.createTable('Prenocisce', (table) => {
            table.increments('ID_prenocisce');
            table.timestamp('datum_dodano').defaultTo(knex.fn.now());
            table.string('naziv').notNullable();
            table.string('tip_prenocisca').notNullable();
            table.string('opis_prenocisca').notNullable();
            table.integer('cena_na_noc').notNullable();
            table.string('koordinate', 50).notNullable();
            table.string('naslov').notNullable();
            table.string('sezona').notNullable();
            table.integer('max_gostov').notNullable();
            table.integer('stevilo_sob').notNullable();
            table.boolean('ljubljencki').defaultTo(false);
            table.boolean('bazen').defaultTo(false);
            table.boolean('trajnostno').defaultTo(false);
            table.boolean('parking').defaultTo(false);
            table.boolean('razgled').defaultTo(false);
            table.boolean('zajtrk').defaultTo(false);
            table.boolean('wifi').defaultTo(false);
            table.text('tagi');
            table.integer('TK_uporabnik').unsigned().references('ID_uporabnik').inTable('Uporabnik');
        });

        console.log('Tabela Prenocisce ustvarjena.');

        const Prenocisce = [
            { naziv: 'Alpine Ski Lodge', datum_dodano: '2024-05-20', tip_prenocisca: 'Gorska koča', opis_prenocisca: 'Koča obdana s prečudovitim razgledom na zasnežene gorske vrhove, zasebno savno in idealno lokacijo blizu večjih smučišč.', cena_na_noc: 180, koordinate: '46.8182,8.2275', naslov: 'Zermatt, Švica', sezona: 'Zima', max_gostov: 4, stevilo_sob: 2, wifi: true, parking: true, razgled: true, bazen: true, tagi: JSON.stringify([{ naziv: '🧖 Zasebna savna & jacuzzi' },{ naziv: '⛷️ Smučanje' },{ naziv: '🛷 Nočno sankanje' },{ naziv: '🏔️ Pohodništvo' }]), TK_uporabnik: 1 },
            { naziv: 'Cliffside Cave Suite', datum_dodano: '2025-03-05', tip_prenocisca: 'Soba v steni', opis_prenocisca: 'Luksuzna soba vklesana v skalno steno nad Egejskim morjem na Santoriniju. Zasebni bazen na terasi z neposrednim pogledom na prečudovito modro morje.', cena_na_noc: 520, koordinate: '36.4619, 25.3764', naslov: 'Oia, Santorini, Grčija', sezona: 'Pomlad / Poletje', max_gostov: 2, stevilo_sob: 1, wifi: true, parking: false, razgled: true, zajtrk: true, bazen: true, tagi: JSON.stringify([{ naziv: '🏊 Zasebni infinity bazen' },{ naziv: '🌅 Najlepši sončni zahod na svetu' },{ naziv: '⛵ Izlet z jadrnico' },{ naziv: '🍷 Degustacija grškega vina' },{ naziv: '🐬 Plavanje z delfini' }]), TK_uporabnik: 1 },
            { naziv: 'Scottish Highland Castle', datum_dodano: '2025-03-18', tip_prenocisca: 'Grad', opis_prenocisca: 'Prenovljeni škotski grad iz 14. stoletja sredi divje narave Highlands. Kamini v vsaki sobi, zasebno jezero za ribolov in whiskey degustacija v grajski kleti.', cena_na_noc: 480, koordinate: '57.4907,-4.2026', naslov: 'Inverness, Škotska', sezona: 'Celo leto', max_gostov: 10, stevilo_sob: 5, wifi: true, parking: true, razgled: true, zajtrk: true, ljubljencki: true, tagi: JSON.stringify([{ naziv: '🏰 Grad iz 14. stoletja' },{ naziv: '🎣 Zasebno jezero za ribolov' },{ naziv: '🥃 Whiskey degustacija' },{ naziv: '🦌 Opazovanje jelenov' },{ naziv: '🔥 Kamin v vsaki sobi' },{ naziv: '👻 Grajska legenda o duhu' }]), TK_uporabnik: 1 },
            { naziv: 'Floating Amazon Lodge', datum_dodano: '2025-04-02', tip_prenocisca: 'Plavajoča hiša', opis_prenocisca: 'Plavajoča lesena hiša na reki Amazonki sredi neokrnjene džungle. Opazujte pirane, kajmane in rožnate delfine neposredno s terase.', cena_na_noc: 310, koordinate: '-3.4653,-62.2159', naslov: 'Amazonas, Brazilija', sezona: 'Poletje / Jesen', max_gostov: 4, stevilo_sob: 2, razgled: true, zajtrk: true, trajnostno: true, tagi: JSON.stringify([{ naziv: '🐊 Opazovanje kajmanov' },{ naziv: '🐬 Opazovanje rožnatih delfinov' },{ naziv: '🌿 Vodeni pohod po džungli' },{ naziv: '🎣 Ribolov piranj' },{ naziv: '🌙 Nočni zvoki džungle' },{ naziv: '🦜 Opazovanje papagajev' }]), TK_uporabnik: 1 },
            { naziv: 'Predjamski grad', datum_dodano: '2026-01-31', tip_prenocisca: 'Grad', opis_prenocisca: 'Predjamski grad, vklesan v mogočno skalno steno, ponuja pravljično doživetje s pridihom zgodovine, skrivnostnih rovov in čudovitega razgleda na kraško pokrajino.', cena_na_noc: 230, koordinate: '45.8150,14.1279', naslov: 'Postojna, Slovenija', sezona: 'Pomlad / Poletje', max_gostov: 6, stevilo_sob: 3, wifi: true, parking: true, razgled: true, tagi: JSON.stringify([{ naziv: '👑 Plemič za en dan' },{ naziv: '🍲 Viteška strežba' },{ naziv: '👁️‍🗨️ Raziskovanje skrivnostnih rovov' },{ naziv: '📚 Zgodovina' },{ naziv: '🐎 Bližina Lipice' }]), TK_uporabnik: 2 },
            { naziv: 'Aurora Bubble Lodge', datum_dodano: '2025-08-08', tip_prenocisca: 'Glamping', opis_prenocisca: 'Prosojna ogrevana kupola sredi islandske narave ponuja čarobno noč pod zvezdami in severnim sijem, idealno za romantičen pobeg v tišino gozda.', cena_na_noc: 310, koordinate: '64.9631,-19.0208', naslov: 'Hella, Islandija', sezona: 'Jesen / Zima', max_gostov: 2, stevilo_sob: 1, wifi: true, parking: true, razgled: true, ljubljencki: true, trajnostno: true, zajtrk: true, tagi: JSON.stringify([{ naziv: '💫 romantično doživetje' },{ naziv: '🌠 Lov na severni sij' },{ naziv: '🔥 Ogrevana kupola' }]), TK_uporabnik: 3 },
            { naziv: 'Cave Hideaway', datum_dodano: '2026-03-17', tip_prenocisca: 'Jama', opis_prenocisca: 'Prespite v skrivnostni jami z mehko svetlobo lantern, naravno hladnim zrakom in občutkom, kot da ste odkrili skriti svet pod zemljo.', cena_na_noc: 167, koordinate: '38.6431,34.8307', naslov: 'Göreme, Kapadokija, Turčija', sezona: 'Celo leto', max_gostov: 4, stevilo_sob: 2, trajnostno: true, tagi: JSON.stringify([{ naziv: '🌡️ Naravno hlajenje' },{ naziv: '🕯️ Večer ob svečah' },{ naziv: '🍷 Degustacija vina' },{ naziv: '🏺 Starodavno vzdušje' },{ naziv: '🔦 Vodeni ogled jame' },{ naziv: '🦇 Večerni polet netopirjev' },{ naziv: '🌌 Spanje v tišini' },{ naziv: '🎈 Polet balonov' }]), TK_uporabnik: 4 },
            { naziv: 'Jungle Treehouse Hideaway', datum_dodano: '2026-05-23', tip_prenocisca: 'Drevesna hišica', opis_prenocisca: 'Drevesna hišica sredi kostariške džungle, kjer vas zjutraj zbudijo tropske ptice in opice, zvečer pa uspava zvok dežja med krošnjami.', cena_na_noc: 420, koordinate: '9.7489,-83.7534', naslov: 'Monteverde, Kostarika', sezona: 'Poletje', max_gostov: 8, stevilo_sob: 4, wifi: true, parking: true, razgled: true, ljubljencki: true, trajnostno: true, zajtrk: true, tagi: JSON.stringify([{ naziv: '🧘 Joga na terasi' },{ naziv: '📵 Digitalni detox' },{ naziv: '🛁 Zunanja kad' },{ naziv: '🌲 Pohod med krošnjami' },{ naziv: '🦥 Jutranji obisk lenivcev' },{ naziv: '🐒 Opazovanje opic' },{ naziv: '🍍 Tropical breakfast basket' },{ naziv: '🔦 Nočni sprehod po džungli' },{ naziv: '🌧️ Zvok tropskega dežja' }]), TK_uporabnik: 5 },
            { naziv: 'Floating Overwater Bungalow', datum_dodano: '2025-06-15', tip_prenocisca: 'Bungalov nad vodo', opis_prenocisca: 'Klasični bungalov na kolih nad turkiznim morjem na Tahitiju z direktnim dostopom do morja skozi steklena tla in zasebni pomol.', cena_na_noc: 445, koordinate: '-17.6509,-149.4260', naslov: 'Bora Bora, Francoska Polinezija', sezona: 'Celo leto', max_gostov: 2, stevilo_sob: 1, wifi: true, razgled: true, zajtrk: true, tagi: JSON.stringify([{ naziv: '🪸 Steklena tla nad morjem' },{ naziv: '⛵ Zasebni pomol' },{ naziv: '🤿 Snorklanje direktno iz sobe' },{ naziv: '🧖 Polinezijska masaža' },{ naziv: '🐠 Hranjenje rib s terase' },{ naziv: '🌅 Sončni zahod nad laguno' }]), TK_uporabnik: 6 },
            { naziv: 'Under the sea hotel', datum_dodano: '2025-04-04', tip_prenocisca: 'Vila pod vodo', opis_prenocisca: 'Podvodni hotel na Maldivih ponuja nepozabno spanje med koralnimi grebeni, kjer skozi steklene stene opazujete pisane ribe, morske želve in čarobni morski svet, kar iz udobja svoje sobe.', cena_na_noc: 333, koordinate: '3.2028,73.2207', naslov: 'Male Atoll, Maldivi', sezona: 'Celo leto', max_gostov: 2, stevilo_sob: 1, wifi: true, parking: true, razgled: true, trajnostno: true, zajtrk: true, tagi: JSON.stringify([{ naziv: '🦈 Plavanje z morskimi psi' },{ naziv: '🧜 Podvodni spa tretma' },{ naziv: '🐠 Koralni greben' },{ naziv: '🤿 Nočno snorklanje z modro svetlečim planktonom' },{ naziv: '🍣 Sushi bar' },{ naziv: '📸 Podvodno fotografiranje' },{ naziv: '🐬 Jutranji izlet z delfini' },{ naziv: '🚁 Panoramski polet nad Atoli' }]), TK_uporabnik: 6 },
            { naziv: 'Salt Flat Mirrored Cabin', datum_dodano: '2025-07-01', tip_prenocisca: 'Hiška sredi solin', opis_prenocisca: 'Kabina z ogledalno zunanjostjo sredi bolivijskih slanih ravnin Salar de Uyuni. Ob deževni sezoni tla postanejo popolno ogledalo neba, kar ustvari mističen efekt neskončnosti.', cena_na_noc: 198, koordinate: '-20.1338,-67.4891', naslov: 'Uyuni, Bolivija', sezona: 'Zima / Pomlad', max_gostov: 2, stevilo_sob: 1, parking: true, razgled: true, zajtrk: true, trajnostno: true, tagi: JSON.stringify([{ naziv: '🪞 Ogledalo neba' },{ naziv: '🦩 Flamingoti v naravi' },{ naziv: '🌌 Nočno fotografiranje zvezd' },{ naziv: '🚗 Tura po slanih ravninah' },{ naziv: '🧂 Hiša iz soli' }]), TK_uporabnik: 6 },
            { naziv: 'Quack & Coffee Houseboat', datum_dodano: '2025-10-11', tip_prenocisca: 'Barka', opis_prenocisca: 'Majhna plavajoča hiška na mirni reki, kjer vas zjutraj namesto alarma zbudijo račke, valovi in vonj sveže kave.', cena_na_noc: 140, koordinate: '52.3676,4.9041', naslov: 'Amsterdam Center, Nizozemska', sezona: 'Pomlad / Poletje', max_gostov: 4, stevilo_sob: 2, wifi: true, trajnostno: true, tagi: JSON.stringify([{ naziv: '🦆 Naravna budnica z račkami' },{ naziv: '🦦 Možnost opazovanja vider' },{ naziv: '🎣 Mini ribiški komplet vključen' },{ naziv: '🌅 Sončni zahod s palube' }]), TK_uporabnik: 7 },
            { naziv: 'Sleepy Train Carriage', datum_dodano: '2026-03-23', tip_prenocisca: 'Prenovljen star vagon', opis_prenocisca: 'Prespite v vintage vagonu, kjer notranjost izgleda kot potovanje v preteklost, zunaj pa vas čaka mirna narava.', cena_na_noc: 210, koordinate: '45.7640, 4.8357', naslov: 'Lyon, Francija', sezona: 'Celo leto', max_gostov: 6, stevilo_sob: 5, wifi: true, parking: true, zajtrk: true, tagi: JSON.stringify([{ naziv: '🔍 Orient express soba/vagon pobega' },{ naziv: '🛤️ Pogled na tirnice' },{ naziv: '🎟️ Mini vozovnica za spomin' },{ naziv: '🍸 Večerja v retro jedilnem vagonu' }]), TK_uporabnik: 8 },
            { naziv: 'Mushroom Forest Hut', datum_dodano: '2024-01-01', tip_prenocisca: 'Pravljična gozdna hiška', opis_prenocisca: 'Majhna okrogla hiška, ki izgleda kot iz pravljice, z mehko svetlobo in vonjem po gozdu.', cena_na_noc: 90, koordinate: '-40.9006,174.8860', naslov: 'Rotorua, Nova Zelandija', sezona: 'Jesen', max_gostov: 2, stevilo_sob: 1, wifi: true, parking: true, trajnostno: true, bazen: true, tagi: JSON.stringify([{ naziv: '🐿️ Jutranji obisk veveric' },{ naziv: '📜 Zemljevid skritih gozdnih kotičkov' },{ naziv: '🧚 Pravljična pot do hiške' },{ naziv: '📵 Digitalni detox' },{ naziv: '🕯️ Večer ob lanternah' },{ naziv: '🧙 Večerni "forest magic" paket' }]), TK_uporabnik: 9 },
            { naziv: 'Hobbit House Shire', datum_dodano: '2025-04-15', tip_prenocisca: 'Zemeljska hiška', opis_prenocisca: 'Resnična hiška hobita vkopana v hrib na Novi Zelandiji, blizu krajev, kjer so snemali film Gospodar prstanov. Okrogla vrata, nizki stropi in čarobno vzdušje Shire-ja v vas zbudijo občutek, kot da ste del filma.', cena_na_noc: 185, koordinate: '-37.8723,175.6828', naslov: 'Matamata, Nova Zelandija', sezona: 'Celo leto', max_gostov: 2, stevilo_sob: 1, wifi: true, parking: true, trajnostno: true, tagi: JSON.stringify([{ naziv: '💍 Vzdušje Gospodarja prstanov' },{ naziv: '🌄 Zeleni hribi Shire-ja' },{ naziv: '🎬 Ogled filmskih lokacij' },{ naziv: '🍺 Lokalno craft pivo' },{ naziv: '🌾 Jutranji sprehod po poljih' }]), TK_uporabnik: 9 },
            { naziv: 'Volcanic Lava Cabin', datum_dodano: '2026-06-10', tip_prenocisca: 'Vulkanska koča', opis_prenocisca: 'Moderna kabina na robu vulkanskega polja na Islandiji, z direktnim pogledom na aktivne tokove lave in gejzirje.', cena_na_noc: 275, koordinate: '63.8800, -22.4300', naslov: 'Grindavík, Islandija', sezona: 'Celo leto', max_gostov: 2, stevilo_sob: 1, wifi: true, parking: true, razgled: true, trajnostno: true, tagi: JSON.stringify([{ naziv: '🌋 Pogled na lavo' },{ naziv: '♨️ Geotermalno ogrevanje' },{ naziv: '🌊 Bližina Blue Lagoon' },{ naziv: '📸 Fotografiranje vulkana' }]), TK_uporabnik: 10 },
            { naziv: 'Arctic Glass Igloo', datum_dodano: '2025-02-01', tip_prenocisca: 'Glamping', opis_prenocisca: 'Stekleni iglu sredi finskega gozda, kjer ležite v topli postelji in opazujete severni sij skozi stekleni strop. Zimska pravljica za prave romantike.', cena_na_noc: 390, koordinate: '68.9222,27.0242', naslov: 'Saariselkä, Finska', sezona: 'Jesen / Zima', max_gostov: 3, stevilo_sob: 1, wifi: true, parking: true, razgled: true, zajtrk: true, tagi: JSON.stringify([{ naziv: '❄️ Stekleni strop' },{ naziv: '🌠 Severni sij' },{ naziv: '🦌 Izlet s severnimi jeleni' },{ naziv: '🎿 Tek na smučeh' },{ naziv: '🛁 Zunanja kad v snegu' }]), TK_uporabnik: 11 },
            { naziv: 'Desert Dome Retreat', datum_dodano: '2025-02-20', tip_prenocisca: 'Glamping', opis_prenocisca: 'Luksuzna geodetska kupola sredi maroške Sahare, z zvezdnatim nebom nad vami in tišino puščave okoli vas. Priporočen kamelji izlet ob sončnem zahodu.', cena_na_noc: 240, koordinate: '31.0461,-4.0083', naslov: 'Merzouga, Maroko', sezona: 'Jesen / Pomlad', max_gostov: 2, stevilo_sob: 1, wifi: true, parking: true, razgled: true, zajtrk: true, trajnostno: true, bazen: true, tagi: JSON.stringify([{ naziv: '🐪 Kamelji izlet' },{ naziv: '🌅 Sončni zahod v Sahari' },{ naziv: '🌌 Opazovanje zvezd' },{ naziv: '🥁 Berbarska glasba ob ognju' },{ naziv: '🏜️ Puščava' }]), TK_uporabnik: 12 },
            { naziv: 'Bamboo Zen Treehouse', datum_dodano: '2025-05-01', tip_prenocisca: 'Drevesna hišica', opis_prenocisca: 'Minimalistična bambusova hišica med riževimi polji na Baliju, z neskončnim pogledom na terase in tropski gozd. Vsakodnevna joga in meditacija sta nekaj, kar vam defenitivno priporočamo.', cena_na_noc: 165, koordinate: '-8.4095,115.1889', naslov: 'Ubud, Bali, Indonezija', sezona: 'Poletje / Jesen', max_gostov: 2, stevilo_sob: 1, wifi: true, parking: true, razgled: true, zajtrk: true, trajnostno: true, tagi: JSON.stringify([{ naziv: '🧘 Joga in meditacija' },{ naziv: '🌾 Pogled na riževa polja' },{ naziv: '🛕 Obiski templjev' },{ naziv: '🧖 Balinezijska masaža' },{ naziv: '🍚 Kuharski tečaj lokalne kulinarike' }]), TK_uporabnik: 12 },
            { naziv: 'Lighthouse Keeper Cottage', datum_dodano: '2025-05-18', tip_prenocisca: 'Svetilnik', opis_prenocisca: 'Prenovljeni svetilnik na skalni pečini nad Atlantskim oceanom na irski obali. Pogled na divje valove, kite in tjulnje direktno iz okna spalnice.', cena_na_noc: 220, koordinate: '52.1390, -10.2678', naslov: 'Dingle, Irska', sezona: 'Pomlad / Poletje', max_gostov: 8, stevilo_sob: 4, wifi: true, parking: true, razgled: true, ljubljencki: true, tagi: JSON.stringify([{ naziv: '🌊 Pogled na Atlantik' },{ naziv: '🐋 Opazovanje kitov' },{ naziv: '🦭 Opazovanje tjulnjev' },{ naziv: '🍺 Irski pub v bližini' },{ naziv: '🎵 Tradicionalna irska glasba' },{ naziv: '🧗 Plezanje po pečinah' }]), TK_uporabnik: 14 },
            { naziv: 'Underground Lava Tube Hotel', datum_dodano: '2026-06-01', tip_prenocisca: 'Podzemna soba', opis_prenocisca: 'Edinstven hotel v naravni lavini cevi na Havajih. Spalnica je vklesana v 500 let staro vulkansko cev z naravno temperaturo 22°C skozi vse leto.', cena_na_noc: 295, koordinate: '19.8968,-155.5828', naslov: 'Hilo, Havaji, ZDA', sezona: 'Celo leto', max_gostov: 2, stevilo_sob: 1, parking: true, trajnostno: true, tagi: JSON.stringify([{ naziv: '🌋 Naravna vulkanska cev' },{ naziv: '🏄 Učne ure surfanja' },{ naziv: '🐢 Opazovanje morskih želv' },{ naziv: '🌺 Havajska hula delavnica' },{ naziv: '🤿 Snorklanje v čistem morju' }]), TK_uporabnik: 15 },
        ];

        await knex('Prenocisce').insert(Prenocisce);
        console.log('Prenocisca uspesno dodana.');

    // NERAZPOLOZLJIV TERMIN
        await knex.schema.createTable('Nerazpolozljiv_termin', (table) => {
            table.increments('ID_nerazpolozljiv_termin');
            table.string('razlog').notNullable();
            table.date('datum_od').notNullable();
            table.date('datum_do').notNullable();
            table.integer('TK_prenocisce').unsigned().references('ID_prenocisce').inTable('Prenocisce');
        });

        console.log('Tabela Nerazpolozljiv termin uspesno ustvarjena.');

        const Nerazpolozljiv_termin = [
            { razlog: 'Zasebna prireditev', datum_od: '2026-06-01', datum_do: '2024-06-05', TK_prenocisce: 5 },
            { razlog: 'Vzdrževanje objekta', datum_od: '2025-07-10', datum_do: '2025-07-15', TK_prenocisce: 12 },
            { razlog: 'Sezonsko zaprtje', datum_od: '2026-12-01', datum_do: '2026-12-31', TK_prenocisce: 7 },
            { razlog: 'Popravila po nevihti', datum_od: '2025-08-05', datum_do: '2025-08-08', TK_prenocisce: 6 },
            { razlog: 'Dopust lastnika', datum_od: '2024-09-20', datum_do: '2024-09-30', TK_prenocisce: 1 },
            { razlog: 'Renovacija kopalnice', datum_od: '2027-02-01', datum_do: '2027-02-07', TK_prenocisce: 1 },
            { razlog: 'Zasebna prireditev', datum_od: '2027-03-15', datum_do: '2027-03-18', TK_prenocisce: 6 },
            { razlog: 'Vzdrževanje', datum_od: '2026-04-01', datum_do: '2026-04-03', TK_prenocisce: 9 },
            { razlog: 'Sezonsko zaprtje', datum_od: '2025-01-10', datum_do: '2025-01-20', TK_prenocisce: 8 },
            { razlog: 'Popravila', datum_od: '2025-05-05', datum_do: '2025-05-08', TK_prenocisce: 13 },
            { razlog: 'Zasebni dogodek', datum_od: '2025-06-20', datum_do: '2025-06-23', TK_prenocisce: 3 },
            { razlog: 'Čiščenje po sezoni', datum_od: '2025-07-01', datum_do: '2025-07-03', TK_prenocisce: 2 },
            { razlog: 'Vzdrževanje bazena', datum_od: '2026-08-10', datum_do: '2026-08-14', TK_prenocisce: 4 },
            { razlog: 'Dopust', datum_od: '2027-09-01', datum_do: '2027-09-07', TK_prenocisce: 15 },
            { razlog: 'Inšpekcija', datum_od: '2025-10-05', datum_do: '2025-10-06', TK_prenocisce: 10 },
            { razlog: 'Zimsko zaprtje', datum_od: '2025-11-30', datum_do: '2026-03-01', TK_prenocisce: 8 },
            { razlog: 'Zasebna poroka', datum_od: '2026-08-20', datum_do: '2026-08-23', TK_prenocisce: 3 },
            { razlog: 'Popravila strehe', datum_od: '2025-04-15', datum_do: '2025-04-20', TK_prenocisce: 14 },
            { razlog: 'Fotografiranje za katalog', datum_od: '2026-09-01', datum_do: '2026-09-02', TK_prenocisce: 2  },
            { razlog: 'Vzdrževanje geotermalnega sistema', datum_od: '2026-03-10', datum_do: '2026-03-13', TK_prenocisce: 16 },
            { razlog: 'Sezonsko odprtje — priprave', datum_od: '2026-10-01', datum_do: '2026-10-05', TK_prenocisce: 17 },
            { razlog: 'Zasebni retreat', datum_od: '2026-11-10', datum_do: '2026-11-14', TK_prenocisce: 18 },
            { razlog: 'Renovacija terase', datum_od: '2026-05-01', datum_do: '2026-05-06', TK_prenocisce: 19 },
            { razlog: 'Popravilo svetilnika', datum_od: '2026-07-15', datum_do: '2026-07-18', TK_prenocisce: 20 },
            { razlog: 'Dezinfekcija po gostih', datum_od: '2025-09-10', datum_do: '2025-09-11', TK_prenocisce: 11 },
            { razlog: 'Lastnik v objektu', datum_od: '2026-12-24', datum_do: '2026-12-27', TK_prenocisce: 15 },
            { razlog: 'Letni pregled', datum_od: '2025-03-01', datum_do: '2025-03-03', TK_prenocisce: 1 },
            { razlog: 'Fotosnemanje za revijo', datum_od: '2026-04-20', datum_do: '2026-04-22', TK_prenocisce: 9 },
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
            table.boolean('povabilo_poslano').notNullable().defaultTo(false);
            table.integer('TK_uporabnik').unsigned().references('ID_uporabnik').inTable('Uporabnik');
            table.integer('TK_prenocisce').unsigned().references('ID_prenocisce').inTable('Prenocisce');
        });

        console.log('Tabela Rezervacija uspesno ustvarjena.');

        const Rezervacija = [
            { datum_od: '2024-06-10', datum_do: '2024-06-15', datum_rezervacije: '2024-05-01', rezervirano: true, povabilo_poslano: true, TK_uporabnik: 1, TK_prenocisce: 1 },
            { datum_od: '2024-07-01', datum_do: '2024-07-07', datum_rezervacije: '2024-06-01', rezervirano: true, povabilo_poslano: true, TK_uporabnik: 2, TK_prenocisce: 2 },
            { datum_od: '2024-08-10', datum_do: '2024-08-14', datum_rezervacije: '2024-07-20', rezervirano: true, povabilo_poslano: true, TK_uporabnik: 3, TK_prenocisce: 3 },
            { datum_od: '2024-09-05', datum_do: '2024-09-10', datum_rezervacije: '2024-08-15', rezervirano: false, povabilo_poslano: false, TK_uporabnik: 4, TK_prenocisce: 4 },
            { datum_od: '2024-10-01', datum_do: '2024-10-05', datum_rezervacije: '2024-09-01', rezervirano: true, povabilo_poslano: true, TK_uporabnik: 5, TK_prenocisce: 5 },
            { datum_od: '2024-06-20', datum_do: '2024-06-25', datum_rezervacije: '2024-05-15', rezervirano: true, povabilo_poslano: true, TK_uporabnik: 6, TK_prenocisce: 6 },
            { datum_od: '2024-07-10', datum_do: '2024-07-14', datum_rezervacije: '2024-06-20', rezervirano: true, povabilo_poslano: true, TK_uporabnik: 7, TK_prenocisce: 7 },
            { datum_od: '2024-07-20', datum_do: '2024-07-25', datum_rezervacije: '2024-06-25', rezervirano: false, povabilo_poslano: false, TK_uporabnik: 8, TK_prenocisce: 8 },
            { datum_od: '2024-08-01', datum_do: '2024-08-05', datum_rezervacije: '2024-07-01', rezervirano: true, povabilo_poslano: true, TK_uporabnik: 9, TK_prenocisce: 9 },
            { datum_od: '2024-08-15', datum_do: '2024-08-20', datum_rezervacije: '2024-07-10', rezervirano: true, povabilo_poslano: true, TK_uporabnik: 1, TK_prenocisce: 3 },
            { datum_od: '2024-09-01', datum_do: '2024-09-05', datum_rezervacije: '2024-08-01', rezervirano: true, povabilo_poslano: true, TK_uporabnik: 2, TK_prenocisce: 5 },
            { datum_od: '2024-09-15', datum_do: '2024-09-20', datum_rezervacije: '2024-08-20', rezervirano: false, povabilo_poslano: false, TK_uporabnik: 3, TK_prenocisce: 7 },
            { datum_od: '2024-10-10', datum_do: '2024-10-15', datum_rezervacije: '2024-09-10', rezervirano: true, povabilo_poslano: true, TK_uporabnik: 4, TK_prenocisce: 2 },
            { datum_od: '2024-10-20', datum_do: '2024-10-25', datum_rezervacije: '2024-09-15', rezervirano: true, povabilo_poslano: true, TK_uporabnik: 5, TK_prenocisce: 4 },
            { datum_od: '2024-11-01', datum_do: '2024-11-05', datum_rezervacije: '2024-10-01', rezervirano: false, povabilo_poslano: false, TK_uporabnik: 6, TK_prenocisce: 1 },
            { datum_od: '2024-11-10', datum_do: '2024-11-15', datum_rezervacije: '2024-10-10', rezervirano: true, povabilo_poslano: true, TK_uporabnik: 7, TK_prenocisce: 6 },
            { datum_od: '2024-11-20', datum_do: '2024-11-25', datum_rezervacije: '2024-10-20', rezervirano: true, povabilo_poslano: true, TK_uporabnik: 8, TK_prenocisce: 3 },
            { datum_od: '2024-12-01', datum_do: '2024-12-05', datum_rezervacije: '2024-11-01', rezervirano: true, povabilo_poslano: true, TK_uporabnik: 9, TK_prenocisce: 8 },
            { datum_od: '2024-12-10', datum_do: '2024-12-15', datum_rezervacije: '2024-11-10', rezervirano: true, povabilo_poslano: true, TK_uporabnik: 1, TK_prenocisce: 9 },
            { datum_od: '2024-12-20', datum_do: '2024-12-27', datum_rezervacije: '2024-11-20', rezervirano: false, povabilo_poslano: false, TK_uporabnik: 2, TK_prenocisce: 4 },
            { datum_od: '2025-01-05', datum_do: '2025-01-10', datum_rezervacije: '2024-12-10', rezervirano: true, povabilo_poslano: true, TK_uporabnik: 3, TK_prenocisce: 1 },
            { datum_od: '2025-01-15', datum_do: '2025-01-20', datum_rezervacije: '2024-12-20', rezervirano: true, povabilo_poslano: true, TK_uporabnik: 4, TK_prenocisce: 6 },
            { datum_od: '2025-02-01', datum_do: '2025-02-06', datum_rezervacije: '2025-01-05', rezervirano: true, povabilo_poslano: true, TK_uporabnik: 5, TK_prenocisce: 3 },
            { datum_od: '2025-02-14', datum_do: '2025-02-17', datum_rezervacije: '2025-01-20', rezervirano: true, povabilo_poslano: true, TK_uporabnik: 6, TK_prenocisce: 2 },
            { datum_od: '2025-03-01', datum_do: '2025-03-07', datum_rezervacije: '2025-02-01', rezervirano: true, povabilo_poslano: true, TK_uporabnik: 7, TK_prenocisce: 5 },
            { datum_od: '2025-03-15', datum_do: '2025-03-20', datum_rezervacije: '2025-02-15', rezervirano: false, povabilo_poslano: false, TK_uporabnik: 8, TK_prenocisce: 9 },
            { datum_od: '2025-04-01', datum_do: '2025-04-05', datum_rezervacije: '2025-03-01', rezervirano: true, povabilo_poslano: true, TK_uporabnik: 9, TK_prenocisce: 4 },
            { datum_od: '2025-04-10', datum_do: '2025-04-15', datum_rezervacije: '2025-03-10', rezervirano: true, povabilo_poslano: true, TK_uporabnik: 10, TK_prenocisce: 7 },
            { datum_od: '2025-04-20', datum_do: '2025-04-26', datum_rezervacije: '2025-03-20', rezervirano: true, povabilo_poslano: true, TK_uporabnik: 11, TK_prenocisce: 1 },
            { datum_od: '2025-05-05', datum_do: '2025-05-10', datum_rezervacije: '2025-04-05', rezervirano: true, povabilo_poslano: true, TK_uporabnik: 12, TK_prenocisce: 8 },
            { datum_od: '2025-05-15', datum_do: '2025-05-20', datum_rezervacije: '2025-04-20', rezervirano: true, povabilo_poslano: true, TK_uporabnik: 13, TK_prenocisce: 10 },
            { datum_od: '2025-06-01', datum_do: '2025-06-06', datum_rezervacije: '2025-05-01', rezervirano: true, povabilo_poslano: true, TK_uporabnik: 14, TK_prenocisce: 11 },
            { datum_od: '2025-06-10', datum_do: '2025-06-15', datum_rezervacije: '2025-05-10', rezervirano: false, povabilo_poslano: false, TK_uporabnik: 15, TK_prenocisce: 12 },
            { datum_od: '2025-07-01', datum_do: '2025-07-07', datum_rezervacije: '2025-06-01', rezervirano: true, povabilo_poslano: true, TK_uporabnik: 1, TK_prenocisce: 13 },
            { datum_od: '2025-07-15', datum_do: '2025-07-20', datum_rezervacije: '2025-06-15', rezervirano: true, povabilo_poslano: true, TK_uporabnik: 2, TK_prenocisce: 14 },
            { datum_od: '2025-08-01', datum_do: '2025-08-05', datum_rezervacije: '2025-07-05', rezervirano: true, povabilo_poslano: true, TK_uporabnik: 3, TK_prenocisce: 15 },
            { datum_od: '2025-08-15', datum_do: '2025-08-20', datum_rezervacije: '2025-07-20', rezervirano: false, povabilo_poslano: false, TK_uporabnik: 4, TK_prenocisce: 16 },
            { datum_od: '2025-09-01', datum_do: '2025-09-06', datum_rezervacije: '2025-08-01', rezervirano: true, povabilo_poslano: true, TK_uporabnik: 5, TK_prenocisce: 17 },
            { datum_od: '2025-09-15', datum_do: '2025-09-20', datum_rezervacije: '2025-08-15', rezervirano: true, povabilo_poslano: true, TK_uporabnik: 6, TK_prenocisce: 18 },
            { datum_od: '2025-10-01', datum_do: '2025-10-07', datum_rezervacije: '2025-09-01', rezervirano: true, povabilo_poslano: true, TK_uporabnik: 7, TK_prenocisce: 19 },
            { datum_od: '2025-10-15', datum_do: '2025-10-20', datum_rezervacije: '2025-09-15', rezervirano: true, povabilo_poslano: true, TK_uporabnik: 8, TK_prenocisce: 20 },
            { datum_od: '2025-11-01', datum_do: '2025-11-06', datum_rezervacije: '2025-10-01', rezervirano: false, povabilo_poslano: false, TK_uporabnik: 9, TK_prenocisce: 2 },
            { datum_od: '2025-11-15', datum_do: '2025-11-20', datum_rezervacije: '2025-10-15', rezervirano: true, povabilo_poslano: true, TK_uporabnik: 10, TK_prenocisce: 3 },
            { datum_od: '2025-12-01', datum_do: '2025-12-07', datum_rezervacije: '2025-11-01', rezervirano: true, povabilo_poslano: true, TK_uporabnik: 11, TK_prenocisce: 6 },
            { datum_od: '2025-12-20', datum_do: '2025-12-27', datum_rezervacije: '2025-11-20', rezervirano: true, povabilo_poslano: true, TK_uporabnik: 12, TK_prenocisce: 17 },
            { datum_od: '2026-01-05', datum_do: '2026-01-10', datum_rezervacije: '2025-12-01', rezervirano: true, povabilo_poslano: true, TK_uporabnik: 13, TK_prenocisce: 1 },
            { datum_od: '2026-01-15', datum_do: '2026-01-20', datum_rezervacije: '2025-12-15', rezervirano: true, povabilo_poslano: true, TK_uporabnik: 14, TK_prenocisce: 7 },
            { datum_od: '2026-02-01', datum_do: '2026-02-06', datum_rezervacije: '2026-01-05', rezervirano: true, povabilo_poslano: true, TK_uporabnik: 15, TK_prenocisce: 9 },
            { datum_od: '2026-02-14', datum_do: '2026-02-17', datum_rezervacije: '2026-01-20', rezervirano: true, povabilo_poslano: true, TK_uporabnik: 1, TK_prenocisce: 17 },
            { datum_od: '2026-03-01', datum_do: '2026-03-07', datum_rezervacije: '2026-02-01', rezervirano: false, povabilo_poslano: false, TK_uporabnik: 2, TK_prenocisce: 11 },
            { datum_od: '2026-04-10', datum_do: '2026-04-15', datum_rezervacije: '2026-03-10', rezervirano: true, povabilo_poslano: true, TK_uporabnik: 3, TK_prenocisce: 18 },
            { datum_od: '2026-05-01', datum_do: '2026-05-06', datum_rezervacije: '2026-04-01', rezervirano: true, povabilo_poslano: true, TK_uporabnik: 4, TK_prenocisce: 19 },
            { datum_od: '2026-06-10', datum_do: '2026-06-15', datum_rezervacije: '2026-05-10', rezervirano: true, povabilo_poslano: true, TK_uporabnik: 5, TK_prenocisce: 20 },
            { datum_od: '2026-07-01', datum_do: '2026-07-06', datum_rezervacije: '2026-06-01', rezervirano: true, povabilo_poslano: true, TK_uporabnik: 6, TK_prenocisce: 4 },
            { datum_od: '2026-07-15', datum_do: '2026-07-20', datum_rezervacije: '2026-06-15', rezervirano: false, povabilo_poslano: false, TK_uporabnik: 7, TK_prenocisce: 15 },
            { datum_od: '2026-08-01', datum_do: '2026-08-07', datum_rezervacije: '2026-07-01', rezervirano: true, povabilo_poslano: true, TK_uporabnik: 8, TK_prenocisce: 5 },
            { datum_od: '2026-09-01', datum_do: '2026-09-05', datum_rezervacije: '2026-08-01', rezervirano: true, povabilo_poslano: true, TK_uporabnik: 9, TK_prenocisce: 13 },
            { datum_od: '2026-10-01', datum_do: '2026-10-06', datum_rezervacije: '2026-09-01', rezervirano: true, povabilo_poslano: true, TK_uporabnik: 10, TK_prenocisce: 16 },
            { datum_od: '2026-11-01', datum_do: '2026-11-06', datum_rezervacije: '2026-10-01', rezervirano: true, povabilo_poslano: true, TK_uporabnik: 11, TK_prenocisce: 17 },
            { datum_od: '2026-12-10', datum_do: '2026-12-16', datum_rezervacije: '2026-11-10', rezervirano: false, povabilo_poslano: false, TK_uporabnik: 12, TK_prenocisce: 6 },
            { datum_od: '2026-06-02', datum_do: '2026-06-05', datum_rezervacije: '2026-05-10', rezervirano: true, povabilo_poslano: false, TK_uporabnik: 10, TK_prenocisce: 6 }, //testno za mail
            { datum_od: '2026-05-02', datum_do: '2026-05-05', datum_rezervacije: '2026-02-10', rezervirano: true, povabilo_poslano: false, TK_uporabnik: 10, TK_prenocisce: 13 }, //testno za mail
        ];

        await knex('Rezervacija').insert(Rezervacija);
        console.log('Rezervacije uspesno dodane.');

    // DOZIVETJE
        await knex.schema.createTable('Dozivetje', (table) => {
            table.increments('ID_dozivetje');
            table.string('naziv').notNullable();
            table.string('opis').notNullable();
            table.decimal('doplacilo', 6, 2).notNullable();
            table.integer('TK_uporabnik').unsigned().references('ID_uporabnik').inTable('Uporabnik').notNullable();
            table.integer('TK_prenocisce').unsigned().references('ID_prenocisce').inTable('Prenocisce');
            table.integer('TK_rezervacija').unsigned().references('ID_rezervacija').inTable('Rezervacija');
        });

        console.log('Tabela Dozivetje uspesno ustvarjena.');

        const Dozivetje = [
            { naziv: '🧖🏻 Zasebna wellness noč', opis: 'Večerni dostop do zasebne savne in jacuzzija s pogledom na zasnežene Alpe.', doplacilo: 59.99, TK_uporabnik: 1, TK_prenocisce: 1 },
            { naziv: '🛷 Nočno sankanje', opis: 'Sankanje pod zvezdami po urejeni progi v bližini koče.', doplacilo: 14.99, TK_uporabnik: 1, TK_prenocisce: 1 },
            { naziv: '⛷️ Inštruktor smučanja', opis: 'Privatne ure smučanja z izkušenim inštruktorjem za vse nivoje.', doplacilo: 79.99, TK_uporabnik: 1, TK_prenocisce: 1 },
            { naziv: '🐬 Plavanje z delfini', opis: 'Voden izlet na odprto Egejsko morje za srečanje z jatami delfinov.', doplacilo: 79.99, TK_uporabnik: 1, TK_prenocisce: 2 },
            { naziv: '🍷 Degustacija grških vin', opis: 'Večer lokalnih vin in sirov z razgledom na kaldera ob sončnem zahodu.', doplacilo: 24.99, TK_uporabnik: 1, TK_prenocisce: 2 },
            { naziv: '🥃 Whiskey degustacija', opis: 'Degustacija vrhunskih škotskih whiskyjev v avtentični grajski kleti.', doplacilo: 39.99, TK_uporabnik: 1, TK_prenocisce: 3 },
            { naziv: '🦌 Opazovanje jelenov', opis: 'Jutranji safari po škotskem posestvu z izkušenim naravoslovcem.', doplacilo: 29.99, TK_uporabnik: 1, TK_prenocisce: 3 },
            { naziv: '🎣 Ribolov na zasebnem jezeru', opis: 'Sproščujoče popoldne z ribiškim kompletom na mirnem zasebnem jezeru.', doplacilo: 19.99, TK_uporabnik: 1, TK_prenocisce: 3 },
            { naziv: '🎣 Ribolov piranj', opis: 'Tradicionalni amazonski ribolov piranj z lokalnim ribičem.', doplacilo: 34.99,  TK_uporabnik: 1, TK_prenocisce: 4  },
            { naziv: '🔦 Nočni safari', opis: 'Opazovanje nočnih živali v džungli z infrardečimi daljnogledi.', doplacilo: 59.99,  TK_uporabnik: 1, TK_prenocisce: 4  },
            { naziv: '🛶 Kanu izlet po Amazonu', opis: 'Dvourni izlet s kanujem med mirnimi rokavi reke ob opazovanju ptic.', doplacilo: 44.99, TK_uporabnik: 4, TK_prenocisce: 4 },  
            { naziv: '🔦 Raziskovanje skrivnih rovov', opis: 'Ekskluzivni nočni ogled podzemnih rovov in skrivnih prehodov pod Predjamskim gradom z baklo v roki.', doplacilo: 34.99, TK_uporabnik: 2, TK_prenocisce: 5  },
            { naziv: '🍽️ Viteška večerja', opis: 'Večerja ob svečah v grajski dvorani z viteškim menijem in srednjeveško glasbo.', doplacilo: 52.99,  TK_uporabnik: 2, TK_prenocisce: 5 },
            { naziv: '🌌 Lov na severni sij', opis: 'Nočni izlet z vodičem za opazovanje severnega sija daleč od mestnih luči.', doplacilo: 99.99, TK_uporabnik: 3, TK_prenocisce: 6 },
            { naziv: '🍽️ Večerja pod zvezdami', opis: 'Romantična islandska večerja postrežena neposredno ob stekleni kupoli.', doplacilo: 39.99, TK_uporabnik: 3, TK_prenocisce: 6 },           
            { naziv: '🎈 Polet balona nad Kapadokijo', opis: 'Jutranji polet z balonom s ptičje perspektive nad čudovitimi skalnimi stolpi.', doplacilo: 139.99, TK_uporabnik: 4, TK_prenocisce: 7 },
            { naziv: '🕯️ Večer ob lanternah', opis: 'Posebna večerja v jami ob lanternah in tradicionalni turški glasbi.', doplacilo: 36.99, TK_uporabnik: 4, TK_prenocisce: 7 },           
            { naziv: '🔦 Nočni sprehod po džungli', opis: 'Voden sprehod po tropski džungli z opazovanjem nočnih živali.', doplacilo: 55.99, TK_uporabnik: 5,  TK_prenocisce: 8 },
            { naziv: '🪷 Joga med krošnjami', opis: 'Jutranja joga na panoramski terasi visoko med drevesnimi krošnjami.', doplacilo: 29.99, TK_uporabnik: 5,  TK_prenocisce: 8 },
            { naziv: '🧖🏻 Polinezijska masaža', opis: 'Sproščujoča masaža z oleji iz kokosovega oreha na zasebni terasi nad morjem.', doplacilo: 65.99,  TK_uporabnik: 6,  TK_prenocisce: 9 },
            { naziv: '⛵ Izlet z jadrnico do atola', opis: 'Polurni izlet z ladjico do bližnjega atola s kristalno čisto vodo in koralnimi grebeni.', doplacilo: 49.99, TK_uporabnik: 6,  TK_prenocisce: 9 },
            { naziv: '📷 Podvodno fotografiranje', opis: 'Profesionalno fotografiranje med raziskovanjem podvodnega sveta.', doplacilo: 110, TK_uporabnik: 6, TK_prenocisce: 10 },
            { naziv: '🍣 Sushi bar izkušnja', opis: 'Ekskluzivna degustacija sveže pripravljenega sushija med opazovanjem rib skozi steklena tla.', doplacilo: 49.99,  TK_uporabnik: 6, TK_prenocisce: 10 },
            { naziv: '🤿 Nočno snorklanje z modro svetlečim planktonom', opis: 'Snorklanje z bioluminiscentnim planktonom.', doplacilo: 89.99, TK_uporabnik: 6,  TK_prenocisce: 10 },
            { naziv: '🚁 Panoramski polet nad Atoli', opis: 'Helikopterski polet z neverjetnim razgledom na turkizne atole Maldivov.',  doplacilo: 189.99, TK_uporabnik: 6, TK_prenocisce: 10 },
            { naziv: '🦈 Plavanje z morskimi psi', opis: 'Organizirano snorklanje med koralnimi grebeni in morskimi psi.', doplacilo: 74.99, TK_uporabnik: 6, TK_prenocisce: 10 },
            { naziv: '🚙 Tura z jeepom po slanih ravninah', opis: 'Tura s terenskim vozilom po neomejenih belih ravninah Salar de Uyuni.', doplacilo: 69.99,  TK_uporabnik: 6, TK_prenocisce: 11 },
            { naziv: '🦩 Flamingo izlet', opis: 'Izlet do lagun, kjer gnezdijo rožnati flamingoti.', doplacilo: 39.99, TK_uporabnik: 6, TK_prenocisce: 11 },
            { naziv: '🥐 Plavajoči zajtrk', opis: 'Svež zajtrk postrežen na leseni plavajoči mizi ob sončnem vzhodu.', doplacilo: 15.99, TK_uporabnik: 7, TK_prenocisce: 12 },
            { naziv: '🚆 Escape room Orient Express', opis: 'Interaktivna skrivnostna igra pobega v stilu stare železnice.', doplacilo: 67.99,  TK_uporabnik: 8,  TK_prenocisce: 13 },         
            { naziv: '🕯️ Večer čarobnih lantern', opis: 'Nočni sprehod skozi osvetljen gozd z lebdečimi lanternami.', doplacilo: 22.99, TK_uporabnik: 9, TK_prenocisce: 14},
            { naziv: '🎥 Filmski ogled Shire', opis: 'Vodeni ogled originalnih snemalnih lokacij Hobbitona.', doplacilo: 27.99, TK_uporabnik: 9, TK_prenocisce: 15 },
            { naziv: '🧺 Piknik v Shireju', opis: 'Tematski piknik z lokalnimi dobrotami sredi zelenih hobbitanskih hribov.', doplacilo: 18.99,  TK_uporabnik: 9, TK_prenocisce: 15 },
            { naziv: '🍺 Craft pivo degustacija', opis: 'Obisk lokalne minipivovarnice z degustacijo štirih sort.', doplacilo: 22.99, TK_uporabnik: 9, TK_prenocisce: 15 },
            { naziv: '🧖🏻 Geotermalni spa', opis: 'Večerno kopanje v naravnih termalnih virih z razgledom na vulkan.', doplacilo: 45.99, TK_uporabnik: 10, TK_prenocisce: 16 },
            { naziv: '🌋 Ogled aktivnega vulkana', opis: 'Voden pohod po vulkanskem območju do roba aktivnega kraterja.', doplacilo: 59.99, TK_uporabnik: 10, TK_prenocisce: 16 },
            { naziv: '🌋 Lava tube pohod', opis: 'Spust v naravno hladno lavino cev s svetilkami in vodičem.', doplacilo: 39.99, TK_uporabnik: 10, TK_prenocisce: 16 },
            { naziv: '🌌 Fotografiranje severnega sija', opis: 'Nočna delavnica fotografije z izkušenim finskim fotografom.', doplacilo: 49.99, TK_uporabnik: 11, TK_prenocisce: 17 },
            { naziv: '🦌 Jelenski safari', opis: 'Izlet na kmetijo severnih jelenov z možnostjo hranjenja.', doplacilo: 39.99, TK_uporabnik: 11, TK_prenocisce: 17 },
            { naziv: '🎿 Tek na smučeh za začetnike', opis: 'Dvourna inštrukcija teka na smučeh v prečudoviti naravi.', doplacilo: 34.99, TK_uporabnik: 11, TK_prenocisce: 17 },
            { naziv: '🐪 Kamelji karavan', opis: 'Tura s kameljo vprego po sipinah ob sončnem zahodu z berberskim čajem.', doplacilo: 29.99,  TK_uporabnik: 12, TK_prenocisce: 18 },
            { naziv: '🎵 Berbarska glasba ob ognju', opis: 'Zvečer se zberemo ob ognju poslušamo tradicionalno glasbo in uživamo v zvezdah nad seboj.', doplacilo: 19.99, TK_uporabnik: 12, TK_prenocisce: 18 },
            { naziv: '🔭 Opazovanje zvezd s teleskopom', opis: 'Amaterski astronom vodi pogled skozi teleskop pod enim najpočistejših nebes na svetu.', doplacilo: 24.99, TK_uporabnik: 12, TK_prenocisce: 18 },
            { naziv: '🪷 Joga in meditacija', opis: 'Jutranja joga in meditacija na odprti terasi med riževimi polji z lokalnim učiteljem.', doplacilo: 24.99,  TK_uporabnik: 12, TK_prenocisce: 19 },
            { naziv: '🧖🏻 Balinezijska masaža', opis: 'Uro dolga masaža z naravnimi olji iz Balija v senci bambusa.', doplacilo: 44.99,  TK_uporabnik: 12, TK_prenocisce: 19 },
            { naziv: '🍚 Kuharski tečaj lokalne hrane', opis: 'Na bližnji tržnici naberte sestavine in skuhate avtentičen balinezijski obrok.', doplacilo: 34.99, TK_uporabnik: 12, TK_prenocisce: 19 },
            { naziv: '🚲 Ogled templjev na kolesu', opis: 'Voden kolesarski izlet do treh bližnjih hinduističnih templjev.', doplacilo: 19.99,  TK_uporabnik: 12, TK_prenocisce: 19 },
            { naziv: '⛯ Ogled svetilnika', opis: 'Dostop do vrha svetilnika z razgledom na prekrasno irsko obalo.', doplacilo: 9.99, TK_uporabnik: 14, TK_prenocisce: 20 },
            { naziv: '🐋 Opazovanje kitov', opis: 'Izlet z ladijco ob irski obali, kjer je mogoče opazovati kite in tjulnje.', doplacilo: 111.99, TK_uporabnik: 14, TK_prenocisce: 20 },
            { naziv: '🧗 Plezanje po pečinah', opis: 'Vodeno plezanje po atlantskih klifih z opremo in inštruktorjem.', doplacilo: 54.99, TK_uporabnik: 14, TK_prenocisce: 20 },
            { naziv: '🍲 Irska kulinarična tura', opis: 'Obisk treh lokalnih restavracij z degustacijo irskih specialitet.', doplacilo: 39.99, TK_uporabnik: 14, TK_prenocisce: 20 },
            { naziv: '🏄‍♂️ Surfanje na Havajih', opis: 'Osnove surfanja z licenciranim inštruktorjem na mirni plaži.', doplacilo: 69.99, TK_uporabnik: 15, TK_prenocisce: 21 },
            { naziv: '🌺 Havajska hula delavnica', opis: 'Naučite se osnov tradicionalnega havajskega plesa hula.', doplacilo: 19.99, TK_uporabnik: 15, TK_prenocisce: 21 },
            { naziv: '🐢 Opazovanje morskih želv', opis: 'Jutranji izlet s kajakom do plaže, kjer se sončijo morske želve.', doplacilo: 34.99, TK_uporabnik: 15, TK_prenocisce: 21 },
            { naziv: '🤿 Snorklanje v naravnem bazenu', opis: 'Snorklanje v naravnem bazenu lava tube z nenavadnimi morskimi organizmi.', doplacilo: 29.99, TK_uporabnik: 15, TK_prenocisce: 21 },
        ];

        await knex('Dozivetje').insert(Dozivetje);
        console.log('Dozivetja uspesno dodana.');

    // SLIKE
        await knex.schema.createTable('Slika', (table) => {
            table.increments('ID_slika');
            table.specificType('slika', 'LONGBLOB');
            table.string('ime_slike');
            table.boolean('cover').defaultTo(false);
            table.integer('TK_uporabnik').unsigned().references('ID_uporabnik').inTable('Uporabnik');
            table.integer('TK_prenocisce').unsigned().references('ID_prenocisce').inTable('Prenocisce');
            table.integer('TK_dozivetje').unsigned().references('ID_dozivetje').inTable('Dozivetje');
        });

        console.log('Tabela Slika uspesno ustvarjena.');

        const fs = require('fs');
        const path = require('path');

        const Slika = [
            { slika: fs.readFileSync(path.join(__dirname, 'frontend/images/svica.jpg')), ime_slike: 'svica.jpg', cover: true, TK_prenocisce: 1 },
            { slika: fs.readFileSync(path.join(__dirname, 'frontend/images/svica_savna.jpg')), ime_slike: 'svica_savna.jpg', cover: false, TK_prenocisce: 1 },
            { slika: fs.readFileSync(path.join(__dirname, 'frontend/images/svica_razgled.jpg')), ime_slike: 'svica_razgled.jpg', cover: false, TK_prenocisce: 1 },
            { slika: fs.readFileSync(path.join(__dirname, 'frontend/images/santorini.png')), ime_slike: 'santorini.png', cover: true, TK_prenocisce: 2 },
            { slika: fs.readFileSync(path.join(__dirname, 'frontend/images/santorini_pool.webp')), ime_slike: 'santorini_pool.webp', cover: false, TK_prenocisce: 2 },
            { slika: fs.readFileSync(path.join(__dirname, 'frontend/images/santorini_view.jpg')), ime_slike: 'santorini_view.jpg', cover: false, TK_prenocisce: 2 },
            { slika: fs.readFileSync(path.join(__dirname, 'frontend/images/skotska.jpg')), ime_slike: 'skotska.jpg', cover: true, TK_prenocisce: 3 },
            { slika: fs.readFileSync(path.join(__dirname, 'frontend/images/skotska_kamin.png')), ime_slike: 'skotska_kamin.png', cover: false, TK_prenocisce: 3 },
            { slika: fs.readFileSync(path.join(__dirname, 'frontend/images/skotska_jezero.jpg')), ime_slike: 'skotska_jezero.jpg', cover: false, TK_prenocisce: 3 },
            { slika: fs.readFileSync(path.join(__dirname, 'frontend/images/amazonas.jpg')), ime_slike: 'amazonas.jpg', cover: true, TK_prenocisce: 4 },
            { slika: fs.readFileSync(path.join(__dirname, 'frontend/images/amazonas_dzungla.png')), ime_slike: 'amazonas_dzungla.png', cover: false, TK_prenocisce: 4 },
            { slika: fs.readFileSync(path.join(__dirname, 'frontend/images/amazonas_reka.jpg')), ime_slike: 'amazonas_reka.jpg', cover: false, TK_prenocisce: 4 },
            { slika: fs.readFileSync(path.join(__dirname, 'frontend/images/slovenija.jpg')), ime_slike: 'slovenija.jpg', cover: true, TK_prenocisce: 5 },
            { slika: fs.readFileSync(path.join(__dirname, 'frontend/images/predjama.png')), ime_slike: 'predjama.png', cover: false, TK_prenocisce: 5 },
            { slika: fs.readFileSync(path.join(__dirname, 'frontend/images/kraljeva.png')), ime_slike: 'kraljeva.png', cover: false, TK_prenocisce: 5 },
            { slika: fs.readFileSync(path.join(__dirname, 'frontend/images/stolpna.png')), ime_slike: 'stolpna.png', cover: false, TK_prenocisce: 5 },
            { slika: fs.readFileSync(path.join(__dirname, 'frontend/images/viteska.png')), ime_slike: 'viteska.png', cover: false, TK_prenocisce: 5 },
            { slika: fs.readFileSync(path.join(__dirname, 'frontend/images/islandija-hotel.jpg')), ime_slike: 'islandija-hotel.jpg', cover: true, TK_prenocisce: 6 },
            { slika: fs.readFileSync(path.join(__dirname, 'frontend/images/islandija.jpg')), ime_slike: 'islandija.jpg', cover: false, TK_prenocisce: 6 },
            { slika: fs.readFileSync(path.join(__dirname, 'frontend/images/jama.jpg')), ime_slike: 'jama.jpg', cover: true, TK_prenocisce: 7 },
            { slika: fs.readFileSync(path.join(__dirname, 'frontend/images/jama_notranjost.jpg')), ime_slike: 'jama_notranjost.jpg', cover: false, TK_prenocisce: 7 },
            { slika: fs.readFileSync(path.join(__dirname, 'frontend/images/kostarika.jpg')), ime_slike: 'kostarika.jpg', cover: true, TK_prenocisce: 8 },
            { slika: fs.readFileSync(path.join(__dirname, 'frontend/images/bora-bora.jpg')), ime_slike: 'bora-bora.jpg', cover: true, TK_prenocisce: 9 },
            { slika: fs.readFileSync(path.join(__dirname, 'frontend/images/maldivi.jpg')), ime_slike: 'maldivi.jpg', cover: true, TK_prenocisce: 10 },
            { slika: fs.readFileSync(path.join(__dirname, 'frontend/images/maldivi_korale.jpg')), ime_slike: 'maldivi_korale.jpg', cover: false, TK_prenocisce: 10 },
            { slika: fs.readFileSync(path.join(__dirname, 'frontend/images/otok.jpg')), ime_slike: 'otok.jpg', cover: false, TK_prenocisce: 10 },
            { slika: fs.readFileSync(path.join(__dirname, 'frontend/images/bolivija.png')), ime_slike: 'bolivija.png', cover: true, TK_prenocisce: 11 },
            { slika: fs.readFileSync(path.join(__dirname, 'frontend/images/soline.jpg')), ime_slike: 'soline.jpg', cover: false, TK_prenocisce: 11 },
            { slika: fs.readFileSync(path.join(__dirname, 'frontend/images/amsterdam.jpg')), ime_slike: 'amsterdam.jpg', cover: true, TK_prenocisce: 12 },
            { slika: fs.readFileSync(path.join(__dirname, 'frontend/images/amsterdam_kanal.jpg')), ime_slike: 'amsterdam_kanal.jpg', cover: false, TK_prenocisce: 12 },
            { slika: fs.readFileSync(path.join(__dirname, 'frontend/images/vlak.jpg')), ime_slike: 'vlak.jpg', cover: true, TK_prenocisce: 13 },
            { slika: fs.readFileSync(path.join(__dirname, 'frontend/images/mushroom.jpg')), ime_slike: 'mushroom.jpg', cover: true, TK_prenocisce: 14 },
            { slika: fs.readFileSync(path.join(__dirname, 'frontend/images/hobbit.jpg')), ime_slike: 'hobbit.jpg', cover: true, TK_prenocisce: 15 },
            { slika: fs.readFileSync(path.join(__dirname, 'frontend/images/vulkan.jpg')), ime_slike: 'vulkan.jpg', cover: true, TK_prenocisce: 16 },
            { slika: fs.readFileSync(path.join(__dirname, 'frontend/images/iglu.jpg')), ime_slike: 'iglu.jpg', cover: true, TK_prenocisce: 17 },
            { slika: fs.readFileSync(path.join(__dirname, 'frontend/images/iglu_sij.jpg')), ime_slike: 'iglu_sij.jpg', cover: false, TK_prenocisce: 17 },
            { slika: fs.readFileSync(path.join(__dirname, 'frontend/images/puscava.jpg')), ime_slike: 'puscava.jpg', cover: true, TK_prenocisce: 18 },
            { slika: fs.readFileSync(path.join(__dirname, 'frontend/images/puscava_zvezde.jpg')), ime_slike: 'puscava_zvezde.jpg', cover: false, TK_prenocisce: 18 },
            { slika: fs.readFileSync(path.join(__dirname, 'frontend/images/bali.jpg')), ime_slike: 'bali.jpg', cover: true, TK_prenocisce: 19 },
            { slika: fs.readFileSync(path.join(__dirname, 'frontend/images/rizeva_polja.jpg')), ime_slike: 'rizeva_polja.jpg', cover: false, TK_prenocisce: 19 },
            { slika: fs.readFileSync(path.join(__dirname, 'frontend/images/svetilnik.jpg')), ime_slike: 'svetilnik.jpg', cover: true, TK_prenocisce: 20 },
            { slika: fs.readFileSync(path.join(__dirname, 'frontend/images/svetilnik_ocean.jpg')), ime_slike: 'svetilnik_ocean.jpg', cover: false, TK_prenocisce: 20 },
            { slika: fs.readFileSync(path.join(__dirname, 'frontend/images/havaji.jpg')), ime_slike: 'havaji.jpg', cover: true, TK_prenocisce: 21 },
            { slika: fs.readFileSync(path.join(__dirname, 'frontend/images/havaji_tube.jpg')), ime_slike: 'havaji_tube.jpg', cover: false, TK_prenocisce: 21 },
            { slika: fs.readFileSync(path.join(__dirname, 'frontend/images/wellness.jpg')), ime_slike: 'wellness.jpg', cover: true, TK_dozivetje: 1 },
            { slika: fs.readFileSync(path.join(__dirname, 'frontend/images/sankanje.jpg')), ime_slike: 'sankanje.jpg', cover: true, TK_dozivetje: 2 },
            { slika: fs.readFileSync(path.join(__dirname, 'frontend/images/smucanje.jpg')), ime_slike: 'smucanje.jpg', cover: true, TK_dozivetje: 3 },
            { slika: fs.readFileSync(path.join(__dirname, 'frontend/images/delfini.jpg')), ime_slike: 'delfini.jpg', cover: true, TK_dozivetje: 4 },
            { slika: fs.readFileSync(path.join(__dirname, 'frontend/images/grsko_vino.jpg')), ime_slike: 'grsko_vino.jpg', cover: true, TK_dozivetje: 5 },
            { slika: fs.readFileSync(path.join(__dirname, 'frontend/images/whisky.jpg')), ime_slike: 'whisky.jpg', cover: true, TK_dozivetje: 6 },
            { slika: fs.readFileSync(path.join(__dirname, 'frontend/images/jelen.jpg')), ime_slike: 'jelen.jpg', cover: true, TK_dozivetje: 7 },
            { slika: fs.readFileSync(path.join(__dirname, 'frontend/images/ribolov.jpg')), ime_slike: 'ribolov.jpg', cover: true, TK_dozivetje: 8 },
            { slika: fs.readFileSync(path.join(__dirname, 'frontend/images/ribolov_piranj.jpg')), ime_slike: 'ribolov_piranj.jpg', cover: true, TK_dozivetje: 9  },
            { slika: fs.readFileSync(path.join(__dirname, 'frontend/images/jungla_noc.webp')), ime_slike: 'jungla_noc.webp', cover: true,  TK_dozivetje: 10 },
            { slika: fs.readFileSync(path.join(__dirname, 'frontend/images/safari_zivali.jpg')), ime_slike: 'safari_zivali.jpg', cover: false, TK_dozivetje: 10 },
            { slika: fs.readFileSync(path.join(__dirname, 'frontend/images/kanu.jpg')), ime_slike: 'kanu.jpg', cover: true, TK_dozivetje: 11 },
            { slika: fs.readFileSync(path.join(__dirname, 'frontend/images/rovi.jpg')), ime_slike: 'rovi.jpg', cover: true, TK_dozivetje: 12 },
            { slika: fs.readFileSync(path.join(__dirname, 'frontend/images/grajska_dvorana.jpg')), ime_slike: 'grajska_dvorana.jpg', cover: true, TK_dozivetje: 13 },
            { slika: fs.readFileSync(path.join(__dirname, 'frontend/images/viteska_vecerja.jpg')), ime_slike: 'viteska_vecerja.jpg', cover: false, TK_dozivetje: 13 },
            { slika: fs.readFileSync(path.join(__dirname, 'frontend/images/severni_sij.webp')), ime_slike: 'severni_sij.webp', cover: true, TK_dozivetje: 14 },
            { slika: fs.readFileSync(path.join(__dirname, 'frontend/images/vecerja_kupola.jpg')), ime_slike: 'vecerja_kupola.jpg', cover: true,  TK_dozivetje: 15 },
            { slika: fs.readFileSync(path.join(__dirname, 'frontend/images/balon.jpg')), ime_slike: 'balon.jpg', cover: true, TK_dozivetje: 16 },
            { slika: fs.readFileSync(path.join(__dirname, 'frontend/images/kapadokija.jpg')), ime_slike: 'kapadokija.jpg', cover: false, TK_dozivetje: 16 },
            { slika: fs.readFileSync(path.join(__dirname, 'frontend/images/lanterne_jama.jpg')), ime_slike: 'lanterne_jama.jpg', cover: true, TK_dozivetje: 17 },
            { slika: fs.readFileSync(path.join(__dirname, 'frontend/images/jungla.jpg')), ime_slike: 'jungla.jpg', cover: true, TK_dozivetje: 18 },
            { slika: fs.readFileSync(path.join(__dirname, 'frontend/images/joga.jpg')), ime_slike: 'joga.jpg', cover: true, TK_dozivetje: 19 },
            { slika: fs.readFileSync(path.join(__dirname, 'frontend/images/masaza.jpg')), ime_slike: 'masaza.jpg', cover: true,  TK_dozivetje: 20 },
            { slika: fs.readFileSync(path.join(__dirname, 'frontend/images/jadrnica.jpg')), ime_slike: 'jadrnica.jpg', cover: true,  TK_dozivetje: 21 },
            { slika: fs.readFileSync(path.join(__dirname, 'frontend/images/podvodno_foto.png')), ime_slike: 'podvodno_foto.png', cover: true, TK_dozivetje: 22 },
            { slika: fs.readFileSync(path.join(__dirname, 'frontend/images/korale.jpg')), ime_slike: 'korale.jpg', cover: false, TK_dozivetje: 22 },
            { slika: fs.readFileSync(path.join(__dirname, 'frontend/images/sushi.jpg')), ime_slike: 'sushi.jpg', cover: true,  TK_dozivetje: 23 },
            { slika: fs.readFileSync(path.join(__dirname, 'frontend/images/plankton.jpg')), ime_slike: 'plankton.jpg', cover: true, TK_dozivetje: 24 },
            { slika: fs.readFileSync(path.join(__dirname, 'frontend/images/helikopter.jpg')), ime_slike: 'helikopter.jpg', cover: true,  TK_dozivetje: 25 },
            { slika: fs.readFileSync(path.join(__dirname, 'frontend/images/morski_pes.jpg')), ime_slike: 'morski_pes.jpg', cover: true, TK_dozivetje: 26 },
            { slika: fs.readFileSync(path.join(__dirname, 'frontend/images/jeep.jpg')), ime_slike: 'jeep.jpg', cover: true, TK_dozivetje: 27 },
            { slika: fs.readFileSync(path.join(__dirname, 'frontend/images/flamingoti.jpg')), ime_slike: 'flamingoti.jpg', cover: true,  TK_dozivetje: 28 },
            { slika: fs.readFileSync(path.join(__dirname, 'frontend/images/plavajoci_zajtrk.jpg')), ime_slike: 'plavajoci_zajtrk.jpg', cover: true, TK_dozivetje: 29 },
            { slika: fs.readFileSync(path.join(__dirname, 'frontend/images/orient_express.jpg')), ime_slike: 'orient_express.jpg', cover: true, TK_dozivetje: 30 },
            { slika: fs.readFileSync(path.join(__dirname, 'frontend/images/lanterne_gozd.jpg')), ime_slike: 'lanterne_gozd.jpg', cover: true, TK_dozivetje: 31 },
            { slika: fs.readFileSync(path.join(__dirname, 'frontend/images/gozd_noc.jpg')), ime_slike: 'gozd_noc.jpg', cover: false, TK_dozivetje: 31 },
            { slika: fs.readFileSync(path.join(__dirname, 'frontend/images/hobbit_tura.jpg')), ime_slike: 'hobbit_tura.jpg', cover: true,  TK_dozivetje: 32 },
            { slika: fs.readFileSync(path.join(__dirname, 'frontend/images/piknik_shire.jpg')), ime_slike: 'piknik_shire.jpg', cover: true, TK_dozivetje: 33 },
            { slika: fs.readFileSync(path.join(__dirname, 'frontend/images/pivo.jpg')), ime_slike: 'pivo.jpg', cover: true, TK_dozivetje: 34 },
            { slika: fs.readFileSync(path.join(__dirname, 'frontend/images/geotermalni_spa.jpg')), ime_slike: 'geotermalni_spa.jpg', cover: true, TK_dozivetje: 35 },
            { slika: fs.readFileSync(path.join(__dirname, 'frontend/images/vulkan_pohod.jpg')), ime_slike: 'vulkan_pohod.jpg', cover: true,  TK_dozivetje: 36 },
            { slika: fs.readFileSync(path.join(__dirname, 'frontend/images/vulkan_krater.jpg')), ime_slike: 'vulkan_krater.jpg', cover: false, TK_dozivetje: 36 },
            { slika: fs.readFileSync(path.join(__dirname, 'frontend/images/lava_tube.jpg')), ime_slike: 'lava_tube.jpg', cover: true,  TK_dozivetje: 37 },
            { slika: fs.readFileSync(path.join(__dirname, 'frontend/images/severni_sij_foto.jpg')), ime_slike: 'severni_sij_foto.jpg', cover: true, TK_dozivetje: 38 },
            { slika: fs.readFileSync(path.join(__dirname, 'frontend/images/jeleni_safari.jpg')), ime_slike: 'jeleni_safari.jpg', cover: true, TK_dozivetje: 39 },
            { slika: fs.readFileSync(path.join(__dirname, 'frontend/images/tek_na_smuceh.jpg')), ime_slike: 'tek_na_smuceh.jpg', cover: true, TK_dozivetje: 40 },
            { slika: fs.readFileSync(path.join(__dirname, 'frontend/images/kamele.jpg')), ime_slike: 'kamele.jpg', cover: true, TK_dozivetje: 41 },
            { slika: fs.readFileSync(path.join(__dirname, 'frontend/images/berbarska_glasba.jpg')),   ime_slike: 'berbarska_glasba.jpg',   cover: true,  TK_dozivetje: 42 },
            { slika: fs.readFileSync(path.join(__dirname, 'frontend/images/teleskop.jpg')), ime_slike: 'teleskop.jpg', cover: true,  TK_dozivetje: 43 },
            { slika: fs.readFileSync(path.join(__dirname, 'frontend/images/bali_joga.jpg')), ime_slike: 'bali_joga.jpg', cover: true,  TK_dozivetje: 44 },
            { slika: fs.readFileSync(path.join(__dirname, 'frontend/images/bali_masaza.jpg')), ime_slike: 'bali_masaza.jpg', cover: true,  TK_dozivetje: 45 },
            { slika: fs.readFileSync(path.join(__dirname, 'frontend/images/kuharski_tecaj.jpg')), ime_slike: 'kuharski_tecaj.jpg', cover: true,  TK_dozivetje: 46 },
            { slika: fs.readFileSync(path.join(__dirname, 'frontend/images/bali_tempelj.jpg')), ime_slike: 'bali_tempelj.jpg', cover: true,  TK_dozivetje: 47 },
            { slika: fs.readFileSync(path.join(__dirname, 'frontend/images/svetilnik_vrh.jpg')), ime_slike: 'svetilnik_vrh.jpg', cover: true, TK_dozivetje: 48 },
            { slika: fs.readFileSync(path.join(__dirname, 'frontend/images/kiti.jpg')), ime_slike: 'kiti.jpg', cover: true, TK_dozivetje: 49 },
            { slika: fs.readFileSync(path.join(__dirname, 'frontend/images/irska_obala.jpg')), ime_slike: 'irska_obala.jpg', cover: false, TK_dozivetje: 49 },
            { slika: fs.readFileSync(path.join(__dirname, 'frontend/images/plezanje.jpg')), ime_slike: 'plezanje.jpg', cover: true, TK_dozivetje: 50 },
            { slika: fs.readFileSync(path.join(__dirname, 'frontend/images/irska_hrana.jpg')), ime_slike: 'irska_hrana.jpg', cover: true, TK_dozivetje: 51 },
            { slika: fs.readFileSync(path.join(__dirname, 'frontend/images/surfanje.jpg')), ime_slike: 'surfanje.jpg', cover: true, TK_dozivetje: 52 },
            { slika: fs.readFileSync(path.join(__dirname, 'frontend/images/surfanje_val.jpg')), ime_slike: 'surfanje_val.jpg', cover: false, TK_dozivetje: 52 },
            { slika: fs.readFileSync(path.join(__dirname, 'frontend/images/hula.jpg')), ime_slike: 'hula.jpg', cover: true, TK_dozivetje: 53 },
            { slika: fs.readFileSync(path.join(__dirname, 'frontend/images/morska_zelva.jpg')), ime_slike: 'morska_zelva.jpg', cover: true, TK_dozivetje: 54 },
            { slika: fs.readFileSync(path.join(__dirname, 'frontend/images/snorklanje.webp')), ime_slike: 'snorklanje.webp', cover: true, TK_dozivetje: 55 },
        ];

        const chunkSize = 5;
        for (let i = 0; i < Slika.length; i += chunkSize) {
            const chunk = Slika.slice(i, i + chunkSize);
            await knex('Slika').insert(chunk);
        }
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
            { vprasanje: 'Ali je parkirišče brezplačno?', odgovor: 'Da, parkirišče je brezplačno za vse goste.', datum_sporocila: '2024-05-10', TK_uporabnik: 4, TK_prenocisce: 1 },
            { vprasanje: 'Ali so hišni ljubljenčki dovoljeni?', odgovor: 'Žal hišnih ljubljenčkov ne sprejemamo.', datum_sporocila: '2024-05-15', TK_uporabnik: 2, TK_prenocisce: 9 },
            { vprasanje: 'Kdaj je možen zgodnji prihod?', odgovor: 'Zgodnji prihod je možen od 10:00 dalje po dogovoru.', datum_sporocila: '2024-06-01', TK_uporabnik: 10, TK_prenocisce: 3 },
            { vprasanje: 'Ali je na voljo WiFi?', odgovor: 'Da, na voljo je brezplačen WiFi.', datum_sporocila: '2024-06-10', TK_uporabnik: 4, TK_prenocisce: 5 },
            { vprasanje: 'Ali je možna brezplacna odpoved rezervacije?', odgovor: 'Brezplačna odpoved je možna do 2 dni pred prihodom.', datum_sporocila: '2024-06-20', TK_uporabnik: 5, TK_prenocisce: 15 },
            { vprasanje: 'Ali je možen pozni odhod?', odgovor: 'Pozni odhod do 14:00 je možen po predhodnem dogovoru.', datum_sporocila: '2024-07-05', TK_uporabnik: 7, TK_prenocisce: 1 },
            { vprasanje: 'Koliko je oddaljen od letališča?', odgovor: 'Od letališča smo oddaljeni približno 45 minut z avtom.', datum_sporocila: '2024-07-15', TK_uporabnik: 8, TK_prenocisce: 6 },
            { vprasanje: 'Ali je zajtrk vključen v ceno?', odgovor: 'Da, bogat zajtrk je vključen za vse goste vsak dan.', datum_sporocila: '2024-08-01', TK_uporabnik: 9, TK_prenocisce: 8 },
            { vprasanje: 'Je primerno za otroke?', odgovor: 'Prenočišče je primerno za otroke starejše od 8 let.', datum_sporocila: '2024-08-10', TK_uporabnik: 10, TK_prenocisce: 3 },
            { vprasanje: 'Ali nudite transfer iz letališča?', odgovor: 'Da, transfer je možen za doplačilo. Kontaktirajte nas.', datum_sporocila: '2024-08-20', TK_uporabnik: 11, TK_prenocisce: 9 },
            { vprasanje: 'Kakšna je politika odpovedi?', odgovor: 'Brezplačna odpoved je možna do 7 dni pred prihodom, po tem se zaračuna 50%.', datum_sporocila: '2024-09-01', TK_uporabnik: 12, TK_prenocisce: 2 },
            { vprasanje: 'Ali je na voljo brezžični internet?', odgovor: 'Da, hitri WiFi je na voljo v celotnem objektu.', datum_sporocila: '2024-09-10', TK_uporabnik: 13, TK_prenocisce: 5 },
            { vprasanje: 'Ali je parking brezplačen?', odgovor: 'Da, varovan parking je brezplačen za vse goste.', datum_sporocila: '2024-09-20', TK_uporabnik: 14, TK_prenocisce: 13 },
            { vprasanje: 'Koliko časa traja pot do najbližjega mesta?', odgovor: 'Do najbližjega mesta je približno 20 minut vožnje.', datum_sporocila: '2024-10-01', TK_uporabnik: 15, TK_prenocisce: 14 },
            { vprasanje: 'Ali je savna vključena v ceno?', odgovor: 'Zasebna savna je na voljo vsak večer za doplačilo.', datum_sporocila: '2024-10-10', TK_uporabnik: 1, TK_prenocisce: 1 },
            { vprasanje: 'Kdaj je možen prihod?', odgovor: 'Prihod je možen od 15:00 dalje, po dogovoru prej.', datum_sporocila: '2024-10-20', TK_uporabnik: 2, TK_prenocisce: 5 },
            { vprasanje: 'Ali je na voljo otroška posteljica?', odgovor: 'Da, otroška posteljica je na voljo brezplačno na zahtevo.', datum_sporocila: '2024-11-01', TK_uporabnik: 3, TK_prenocisce: 3 },
            { vprasanje: 'Ali ponujate vegetarijansko hrano?', odgovor: 'Da, vegetarijanski in veganski zajtrk sta na voljo na zahtevo.', datum_sporocila: '2024-11-10', TK_uporabnik: 4, TK_prenocisce: 8 },
            { vprasanje: 'Je možno podaljšanje bivanja?', odgovor: 'Podaljšanje je možno glede na razpoložljivost termina.', datum_sporocila: '2024-11-20', TK_uporabnik: 5, TK_prenocisce: 9 },
            { vprasanje: 'Ali je bazen grajan ali naravni?', odgovor: 'Bazen je zasebni infinity bazen z morsko vodo na terasi.', datum_sporocila: '2024-12-01', TK_uporabnik: 6, TK_prenocisce: 2 },
            { vprasanje: 'Kakšna je minimalna dolžina bivanja?', odgovor: 'Minimalna dolžina bivanja sta 2 noči, v sezoni 3 noči.', datum_sporocila: '2024-12-10', TK_uporabnik: 7, TK_prenocisce: 6 },
            { vprasanje: 'Ali je objekt primeren za invalide?', odgovor: 'Žal objekt ni prilagojen za invalide zaradi naravnih ovir.', datum_sporocila: '2025-01-05', TK_uporabnik: 8, TK_prenocisce: 7 },
            { vprasanje: 'Ali je možno organizirati presenečenje za partnerja?', odgovor: 'Seveda! Kontaktirajte nas vnaprej in vse organiziramo.', datum_sporocila: '2025-01-15', TK_uporabnik: 9, TK_prenocisce: 6 },
            { vprasanje: 'Kakšno vreme pričakovati pozimi?', odgovor: 'Pozimi je temperatura med -5 in 5°C, pogost je sneg.', datum_sporocila: '2025-02-01', TK_uporabnik: 10, TK_prenocisce: 1 },
            { vprasanje: 'Ali je blizu kakšna restavracija?', odgovor: 'Najbližja restavracija je 10 minut hoje, priporočamo rezervacijo.', datum_sporocila: '2025-02-15', TK_uporabnik: 11, TK_prenocisce: 14 },
            { vprasanje: 'Ali je možen skupinski prihod?', odgovor: 'Da, za večje skupine nas kontaktirajte za posebne pogoje.', datum_sporocila: '2025-03-01', TK_uporabnik: 12, TK_prenocisce: 3 },
            { vprasanje: 'Ali je na voljo kuhinja za goste?', odgovor: 'Da, popolno opremljena kuhinja je na voljo vsem gostom.', datum_sporocila: '2025-03-10', TK_uporabnik: 13, TK_prenocisce: 12 },
            { vprasanje: 'Kako daleč je do plaže?', odgovor: 'Do plaže je 5 minut hoje po sprehajalni poti ob obali.', datum_sporocila: '2025-03-20', TK_uporabnik: 14, TK_prenocisce: 20 },
            { vprasanje: 'Ali je možno najeti kolo?', odgovor: 'Da, kolesa so na voljo za goste brezplačno.', datum_sporocila: '2025-04-01', TK_uporabnik: 15, TK_prenocisce: 12 },
            { vprasanje: 'Ali sprejemate hišne ljubljenčke?', odgovor: 'Da, manjši hišni ljubljenčki so dobrodošli za doplačilo 15 €/noč.', datum_sporocila: '2026-06-01', TK_uporabnik: 1, TK_prenocisce: 20 },
            { vprasanje: 'Ali je možen prihod po polnoči?', odgovor: 'Da, z uporabo kode za samostojno prijavo.', datum_sporocila: '2025-04-20', TK_uporabnik: 13, TK_prenocisce: 11 },
            { vprasanje: 'Ali nudite prevoz do letališča?', odgovor: 'Da, za doplačilo.', datum_sporocila: '2025-04-25', TK_uporabnik: 14, TK_prenocisce: 12 },
            { vprasanje: 'Ali je v bližini trgovina?', odgovor: 'Najbližja trgovina je oddaljena 3 km.', datum_sporocila: '2025-05-01', TK_uporabnik: 15, TK_prenocisce: 13 },
            { vprasanje: 'Ali je na voljo pralni stroj?', odgovor: 'Da.', datum_sporocila: '2025-05-03', TK_uporabnik: 11, TK_prenocisce: 14 },
            { vprasanje: 'Ali lahko rezerviram dodatno posteljo?', odgovor: 'Seveda.', datum_sporocila: '2025-05-05', TK_uporabnik: 12, TK_prenocisce: 15 },
            { vprasanje: 'Ali je možna pozna odjava?', odgovor: null, datum_sporocila: '2025-05-08', TK_uporabnik: 8, TK_prenocisce: 16 },
            { vprasanje: 'Ali je bazen ogrevan?', odgovor: null, datum_sporocila: '2025-05-10', TK_uporabnik: 7, TK_prenocisce: 17 },
            { vprasanje: 'Ali je v bližini bankomat?', odgovor: null, datum_sporocila: '2025-05-15', TK_uporabnik: 6, TK_prenocisce: 18 },
            { vprasanje: 'Ali sprejemate večje pse?', odgovor: null, datum_sporocila: '2025-05-18', TK_uporabnik: 5, TK_prenocisce: 19 },
            { vprasanje: 'Ali organizirate izlete?', odgovor: null, datum_sporocila: '2026-06-01', TK_uporabnik: 4, TK_prenocisce: 20 },
            { vprasanje: 'Ali je kuhinja popolnoma opremljena?', odgovor: 'Da.', datum_sporocila: '2025-05-21', TK_uporabnik: 3, TK_prenocisce: 11 },
            { vprasanje: 'Koliko je oddaljeno smučišče?', odgovor: 'Približno 10 minut peš.', datum_sporocila: '2025-01-22', TK_uporabnik: 2, TK_prenocisce: 1 },
            { vprasanje: 'Ali je možno rezervirati masažo?', odgovor: 'Da.', datum_sporocila: '2025-05-23', TK_uporabnik: 1, TK_prenocisce: 13 },
            { vprasanje: 'Ali imate polnilnico za električne avtomobile?', odgovor: 'Da.', datum_sporocila: '2025-05-24', TK_uporabnik: 10, TK_prenocisce: 14 },
            { vprasanje: 'Ali nudite vegetarijanski zajtrk?', odgovor: 'Da.', datum_sporocila: '2025-05-25', TK_uporabnik: 9, TK_prenocisce: 15 },
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
            { datum: '2024-05-01', TK_uporabnik: 1, TK_prenocisce: 12 },
            { datum: '2024-05-10', TK_uporabnik: 1, TK_prenocisce: 6 },
            { datum: '2024-05-15', TK_uporabnik: 1, TK_prenocisce: 11 },
            { datum: '2025-03-01', TK_uporabnik: 1, TK_prenocisce: 20 },
            { datum: '2025-03-02', TK_uporabnik: 2, TK_prenocisce: 20 },
            { datum: '2024-06-01', TK_uporabnik: 2, TK_prenocisce: 8 },
            { datum: '2024-06-10', TK_uporabnik: 2, TK_prenocisce: 7 },
            { datum: '2024-06-20', TK_uporabnik: 2, TK_prenocisce: 3 },
            { datum: '2024-07-01', TK_uporabnik: 3, TK_prenocisce: 9 },
            { datum: '2024-07-10', TK_uporabnik: 3, TK_prenocisce: 14 },
            { datum: '2024-07-20', TK_uporabnik: 4, TK_prenocisce: 10 },
            { datum: '2024-08-01', TK_uporabnik: 4, TK_prenocisce: 15 },
            { datum: '2024-08-10', TK_uporabnik: 4, TK_prenocisce: 11 },
            { datum: '2024-08-20', TK_uporabnik: 4, TK_prenocisce: 16 },
            { datum: '2024-09-01', TK_uporabnik: 5, TK_prenocisce: 13 },
            { datum: '2024-09-10', TK_uporabnik: 5, TK_prenocisce: 14 },
            { datum: '2024-09-20', TK_uporabnik: 5, TK_prenocisce: 15 },
            { datum: '2024-10-01', TK_uporabnik: 5, TK_prenocisce: 16 },
            { datum: '2024-10-10', TK_uporabnik: 6, TK_prenocisce: 18 },
            { datum: '2024-10-20', TK_uporabnik: 6, TK_prenocisce: 19 },
            { datum: '2024-11-01', TK_uporabnik: 7, TK_prenocisce: 20 },
            { datum: '2024-11-10', TK_uporabnik: 7, TK_prenocisce: 3 },
            { datum: '2024-11-20', TK_uporabnik: 7, TK_prenocisce: 5 },
            { datum: '2024-12-01', TK_uporabnik: 7, TK_prenocisce: 1 },
            { datum: '2024-12-10', TK_uporabnik: 8, TK_prenocisce: 16 },
            { datum: '2024-12-20', TK_uporabnik: 9, TK_prenocisce: 17 },
            { datum: '2025-01-05', TK_uporabnik: 10, TK_prenocisce: 18 },
            { datum: '2025-01-15', TK_uporabnik: 11, TK_prenocisce: 19 },
            { datum: '2025-02-01', TK_uporabnik: 12, TK_prenocisce: 20 },
            { datum: '2025-02-15', TK_uporabnik: 13, TK_prenocisce: 4 },
            { datum: '2025-03-01', TK_uporabnik: 13, TK_prenocisce: 7 },
            { datum: '2025-03-15', TK_uporabnik: 15, TK_prenocisce: 12 }
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
            { datum_komentar: '2024-06-20', ocena_splosna: 5, ocena_udobje: 4, ocena_unikatnost: 5, ocena_lokacija: 5, ocena_cenovna_ugodnost: 3, ocena_dozivetje: 5, TK_uporabnik: 6, TK_prenocisce: 1 },
            { komentar: 'Severni sij iz igluja je bil magičen.', datum_komentar: '2024-07-15', ocena_splosna: 5, ocena_udobje: 4, ocena_unikatnost: 5, ocena_lokacija: 5, ocena_cenovna_ugodnost: 2, ocena_dozivetje: 5, TK_uporabnik: 2, TK_prenocisce: 17 },
            { komentar: 'Drevesna hiška je zelo romantična, malo hladna ponoči.', datum_komentar: '2024-08-20', ocena_splosna: 4, ocena_udobje: 3, ocena_unikatnost: 4, ocena_lokacija: 4, ocena_cenovna_ugodnost: 4, ocena_dozivetje: 3, TK_uporabnik: 3, TK_prenocisce: 5 },
            { komentar: 'Spanje med koralnimi grebeni je bilo kot iz sanj, ribe so plavale tik ob postelji.', datum_komentar: '2024-09-15', ocena_splosna: 5, ocena_udobje: 5, ocena_unikatnost: 5, ocena_lokacija: 5, ocena_cenovna_ugodnost: 3, ocena_dozivetje: 4, TK_uporabnik: 4, TK_prenocisce: 6 },
            { komentar: 'Podzemna soba je hladna, ampak super unikatna izkušnja.', datum_komentar: '2024-10-10', ocena_splosna: 4, ocena_udobje: 3, ocena_unikatnost: 5, ocena_lokacija: 4, ocena_cenovna_ugodnost: 4, ocena_dozivetje: 3, TK_uporabnik: 5, TK_prenocisce: 4 },
            { komentar: 'Čudovit razgled in zelo prijazno osebje. Zajtrk je bil odličen.', datum_komentar: '2024-06-20', ocena_splosna: 5, ocena_udobje: 4, ocena_unikatnost: 5, ocena_lokacija: 5, ocena_cenovna_ugodnost: 3, ocena_dozivetje: 5, TK_uporabnik: 1, TK_prenocisce: 2 },
            { komentar: 'Soba je bila čista in moderna, lokacija pa zelo mirna.', datum_komentar: '2024-07-12', ocena_splosna: 4, ocena_udobje: 5, ocena_unikatnost: 4, ocena_lokacija: 4, ocena_cenovna_ugodnost: 5, ocena_dozivetje: 4, TK_uporabnik: 6, TK_prenocisce: 2 },
            { komentar: 'Odlična izkušnja, vendar je bil internet precej počasen.', datum_komentar: '2024-08-05', ocena_splosna: 4, ocena_udobje: 4, ocena_unikatnost: 3, ocena_lokacija: 5, ocena_cenovna_ugodnost: 4, ocena_dozivetje: 4, TK_uporabnik: 3, TK_prenocisce: 2 },
            { komentar: 'Zelo prijetno vzdušje in odlična lokacija blizu narave.', datum_komentar: '2024-09-01', ocena_splosna: 5, ocena_udobje: 5, ocena_unikatnost: 4, ocena_lokacija: 5, ocena_cenovna_ugodnost: 4, ocena_dozivetje: 5, TK_uporabnik: 4, TK_prenocisce: 2 },
            { komentar: 'Zasebna savna z razgledom na Alpe, nepozabna izkušnja!', datum_komentar: '2024-06-20', ocena_splosna: 5, ocena_udobje: 5, ocena_unikatnost: 5, ocena_lokacija: 5, ocena_cenovna_ugodnost: 4, ocena_dozivetje: 5, TK_uporabnik: 12, TK_prenocisce: 1 },
            { komentar: 'Čudovit razgled in zelo prijazno osebje. Zajtrk je bil odličen.', datum_komentar: '2024-07-12', ocena_splosna: 5, ocena_udobje: 4, ocena_unikatnost: 5, ocena_lokacija: 5, ocena_cenovna_ugodnost: 3, ocena_dozivetje: 5, TK_uporabnik: 13, TK_prenocisce: 1 },
            { komentar: 'Grad je defenitivno presegel vsa naša pričakovanja. Najboljši del obiska je bila viteška večerja, ki je bila fantastična!', datum_komentar: '2024-07-15', ocena_splosna: 5, ocena_udobje: 4, ocena_unikatnost: 5, ocena_lokacija: 5, ocena_cenovna_ugodnost: 3, ocena_dozivetje: 5, TK_uporabnik: 14, TK_prenocisce: 5 },
            { komentar: 'Predjamski grad je kot iz pravljice.', datum_komentar: '2024-08-20', ocena_splosna: 5, ocena_udobje: 4, ocena_unikatnost: 5, ocena_lokacija: 5, ocena_cenovna_ugodnost: 3, ocena_dozivetje: 4, TK_uporabnik: 2, TK_prenocisce: 5 },
            { komentar: 'Severni sij smo videli kar trikrat iz kupole, absolutno čarobno!', datum_komentar: '2024-08-25', ocena_splosna: 5, ocena_udobje: 5, ocena_unikatnost: 5, ocena_lokacija: 4, ocena_cenovna_ugodnost: 3, ocena_dozivetje: 5, TK_uporabnik: 3, TK_prenocisce: 6 },
            { komentar: 'Bolj romantičnega mesta na svetu ni. Kupola pod severnim sijem je eno najlepših prenočišč v katerem sva kadarkoli spala!', datum_komentar: '2024-09-01', ocena_splosna: 5, ocena_udobje: 5, ocena_unikatnost: 5, ocena_lokacija: 5, ocena_cenovna_ugodnost: 3, ocena_dozivetje: 5, TK_uporabnik: 4, TK_prenocisce: 6 },
            { komentar: 'Jama presenetljivo udobna. Vzdušje je bilo mistično in posebno.', datum_komentar: '2024-09-15', ocena_splosna: 4, ocena_udobje: 4, ocena_unikatnost: 5, ocena_lokacija: 4, ocena_cenovna_ugodnost: 4, ocena_dozivetje: 4, TK_uporabnik: 5, TK_prenocisce: 7 },
            { komentar: 'Jutranji polet z balonom je bil čudovit!', datum_komentar: '2024-09-20', ocena_splosna: 5, ocena_udobje: 4, ocena_unikatnost: 5, ocena_lokacija: 5, ocena_cenovna_ugodnost: 4, ocena_dozivetje: 5, TK_uporabnik: 6, TK_prenocisce: 7 },
            { komentar: 'Džungla je bila neverjetna. Vsako jutro nas je zbudil zvok ptic in opic.', datum_komentar: '2024-10-05', ocena_splosna: 5, ocena_udobje: 4, ocena_unikatnost: 5, ocena_lokacija: 5, ocena_cenovna_ugodnost: 3, ocena_dozivetje: 5, TK_uporabnik: 7, TK_prenocisce: 8 },
            { komentar: 'Drevesna hišica je sanjsko prenočišče za odklop. Obisk opic zjutraj je ena najbolj unikatnih doživetij, ki smo jih imeli čast izkusiti!', datum_komentar: '2024-10-15', ocena_splosna: 5, ocena_udobje: 4, ocena_unikatnost: 5, ocena_lokacija: 5, ocena_cenovna_ugodnost: 3, ocena_dozivetje: 5, TK_uporabnik: 8, TK_prenocisce: 8 },
            { komentar: 'Spanje pod morjem presega vse predstave. Enkratna izkušnja!', datum_komentar: '2024-10-20', ocena_splosna: 5, ocena_udobje: 5, ocena_unikatnost: 5, ocena_lokacija: 5, ocena_cenovna_ugodnost: 2, ocena_dozivetje: 5, TK_uporabnik: 9, TK_prenocisce: 9 },
            { komentar: 'Ribe so plavale tik ob postelji, ne morem opisati občutka, ki nam ga je to prenočišče pričaralo.', datum_komentar: '2024-11-01', ocena_splosna: 5, ocena_udobje: 5, ocena_unikatnost: 5, ocena_lokacija: 5, ocena_cenovna_ugodnost: 2, ocena_dozivetje: 5, TK_uporabnik: 10, TK_prenocisce: 9 },
            { komentar: 'Steklena tla nad morjem so bila čarobna.', datum_komentar: '2024-11-10', ocena_splosna: 5, ocena_udobje: 5, ocena_unikatnost: 5, ocena_lokacija: 5, ocena_cenovna_ugodnost: 2, ocena_dozivetje: 5, TK_uporabnik: 11, TK_prenocisce: 10 },
            { komentar: 'Snorklanje direktno iz sobe je bilo neverjetno doživetje, ki bi ga z veseljem ponovno doživeli!', datum_komentar: '2024-11-20', ocena_splosna: 5, ocena_udobje: 5, ocena_unikatnost: 5, ocena_lokacija: 5, ocena_cenovna_ugodnost: 3, ocena_dozivetje: 5, TK_uporabnik: 12, TK_prenocisce: 10 },
            { komentar: 'Fotografije so bile absolutno neverjetne.', datum_komentar: '2024-12-05', ocena_splosna: 5, ocena_udobje: 4, ocena_unikatnost: 5, ocena_lokacija: 5, ocena_cenovna_ugodnost: 4, ocena_dozivetje: 4, TK_uporabnik: 13, TK_prenocisce: 11 },
            { komentar: 'Barka na reki Amsterdam je res mirno, posebno in enkratno doživetje.', datum_komentar: '2024-12-15', ocena_splosna: 4, ocena_udobje: 4, ocena_unikatnost: 5, ocena_lokacija: 5, ocena_cenovna_ugodnost: 4, ocena_dozivetje: 3, TK_uporabnik: 14, TK_prenocisce: 12 },
            { komentar: 'Amsterdam iz vode je čisto drugačen. Račke so bile bonus!', datum_komentar: '2025-01-10', ocena_splosna: 4, ocena_udobje: 4, ocena_unikatnost: 4, ocena_lokacija: 5, ocena_cenovna_ugodnost: 4, ocena_dozivetje: 3, TK_uporabnik: 15, TK_prenocisce: 12 },
            { komentar: 'Vintage vagon z dušo. Večerja v jedilnem vagonu bila vrhunska.', datum_komentar: '2025-01-20', ocena_splosna: 4, ocena_udobje: 4, ocena_unikatnost: 5, ocena_lokacija: 3, ocena_cenovna_ugodnost: 3, ocena_dozivetje: 4, TK_uporabnik: 1, TK_prenocisce: 13 },
            { komentar: 'Idealno za digitalni detox.', datum_komentar: '2025-02-05', ocena_splosna: 5, ocena_udobje: 5, ocena_unikatnost: 5, ocena_lokacija: 4, ocena_cenovna_ugodnost: 5, ocena_dozivetje: 5, TK_uporabnik: 2, TK_prenocisce: 14 },
            { komentar: 'Gozdna hiška kot iz Hobita. Najlepši vikend v življenju!', datum_komentar: '2025-02-15', ocena_splosna: 5, ocena_udobje: 5, ocena_unikatnost: 5, ocena_lokacija: 4, ocena_cenovna_ugodnost: 5, ocena_dozivetje: 5, TK_uporabnik: 3, TK_prenocisce: 14 },
            { datum_komentar: '2025-03-10', ocena_splosna: 5, ocena_udobje: 4, ocena_unikatnost: 5, ocena_lokacija: 4, ocena_cenovna_ugodnost: 4, ocena_dozivetje: 4, TK_uporabnik: 4, TK_prenocisce: 15 },
            { komentar: 'Sončni zahod iz zasebnega bazena je res nepozaben.', datum_komentar: '2025-03-20', ocena_splosna: 5, ocena_udobje: 5, ocena_unikatnost: 5, ocena_lokacija: 5, ocena_cenovna_ugodnost: 2, ocena_dozivetje: 5, TK_uporabnik: 5, TK_prenocisce: 2 },
            { komentar: 'Whisky in kamin ob večerih predstavljata moj idealen večer. Ta grad je definitivno vreden obiska', datum_komentar: '2025-04-15', ocena_splosna: 5, ocena_udobje: 5, ocena_unikatnost: 5, ocena_lokacija: 5, ocena_cenovna_ugodnost: 3, ocena_dozivetje: 5, TK_uporabnik: 7, TK_prenocisce: 3 },
            { komentar: 'Zjutraj smo pred gradom videli jelene. Škotska narava je neverjetna!', datum_komentar: '2025-04-25', ocena_splosna: 5, ocena_udobje: 5, ocena_unikatnost: 5, ocena_lokacija: 5, ocena_cenovna_ugodnost: 3, ocena_dozivetje: 4, TK_uporabnik: 8, TK_prenocisce: 3 },
            { datum_komentar: '2025-05-10', ocena_splosna: 5, ocena_udobje: 4, ocena_unikatnost: 5, ocena_lokacija: 5, ocena_cenovna_ugodnost: 3, ocena_dozivetje: 5, TK_uporabnik: 9, TK_prenocisce: 4 },
            { datum_komentar: '2025-05-20', ocena_splosna: 5, ocena_udobje: 4, ocena_unikatnost: 5, ocena_lokacija: 5, ocena_cenovna_ugodnost: 4, ocena_dozivetje: 5, TK_uporabnik: 10, TK_prenocisce: 18 },
            { komentar: 'Joga in prelep razgled na riževa polja vsako jutro.', datum_komentar: '2025-06-05', ocena_splosna: 3, ocena_udobje: 4, ocena_unikatnost: 4, ocena_lokacija: 3, ocena_cenovna_ugodnost: 3, ocena_dozivetje: 3, TK_uporabnik: 11, TK_prenocisce: 19 },
            { komentar: 'Valovi in tjulnji so bili pravi show vsak dan!', datum_komentar: '2025-06-15', ocena_splosna: 5, ocena_udobje: 4, ocena_unikatnost: 5, ocena_lokacija: 5, ocena_cenovna_ugodnost: 3, ocena_dozivetje: 4, TK_uporabnik: 12, TK_prenocisce: 20 },
            { komentar: 'Opazovanje kitov iz svetilnika je eno najbolj enkratnih doživetij, ki jih človek lahko izkusi.', datum_komentar: '2025-07-01', ocena_splosna: 5, ocena_udobje: 4, ocena_unikatnost: 5, ocena_lokacija: 5, ocena_cenovna_ugodnost: 3, ocena_dozivetje: 5, TK_uporabnik: 13, TK_prenocisce: 20 },
            { komentar: 'Irska kulinarična tura z degustacijo lokalnih jedi je bil odličen zaključek potovanja.', datum_komentar: '2025-10-20', ocena_splosna: 4, ocena_udobje: 4, ocena_unikatnost: 5, ocena_lokacija: 5, ocena_cenovna_ugodnost: 3, ocena_dozivetje: 4, TK_uporabnik: 8, TK_prenocisce: 20 },
            { komentar: 'Kuharski tečaj z lokalnim kuharjem je bil eden najboljših delov potovanja.', datum_komentar: '2025-10-07', ocena_splosna: 5, ocena_udobje: 4, ocena_unikatnost: 4, ocena_lokacija: 4, ocena_cenovna_ugodnost: 3, ocena_dozivetje: 5, TK_uporabnik: 7, TK_prenocisce: 19 },
            { komentar: 'Nočno sankanje je bila posebna izkušnja. Vrnem se zagotovo.', datum_komentar: '2025-01-15', ocena_splosna: 5, ocena_udobje: 4, ocena_unikatnost: 4, ocena_lokacija: 5, ocena_cenovna_ugodnost: 3, ocena_dozivetje: 5, TK_uporabnik: 3, TK_prenocisce: 1 },
            { datum_komentar: '2025-04-26', ocena_splosna: 4, ocena_udobje: 4, ocena_unikatnost: 4, ocena_lokacija: 5, ocena_cenovna_ugodnost: 3, ocena_dozivetje: 4, TK_uporabnik: 11, TK_prenocisce: 1 },
            { komentar: 'Ribolov na zasebnem jezeru je bil popolnoma sproščujoč. Odlična izkušnja.', datum_komentar: '2025-11-20', ocena_splosna: 5, ocena_udobje: 4, ocena_unikatnost: 3, ocena_lokacija: 5, ocena_cenovna_ugodnost: 3, ocena_dozivetje: 5, TK_uporabnik: 10, TK_prenocisce: 3 },
            { komentar: 'Džungla, reka, delfini - vse v enem. Nepozabna izkušnja.', datum_komentar: '2026-07-06', ocena_splosna: 5, ocena_udobje: 3, ocena_unikatnost: 5, ocena_lokacija: 5, ocena_cenovna_ugodnost: 4, ocena_dozivetje: 5, TK_uporabnik: 6, TK_prenocisce: 4 },
            { komentar: 'Ogled gradu in skrivnih rovov z baklo je bil vrhunec potovanja po Sloveniji.', datum_komentar: '2025-03-07', ocena_splosna: 5, ocena_udobje: 4, ocena_unikatnost: 5, ocena_lokacija: 5, ocena_cenovna_ugodnost: 4, ocena_dozivetje: 5, TK_uporabnik: 7, TK_prenocisce: 5 },
            { komentar: 'Romantična večerja pod kupolom je bila popolna. Hvala za nepozabno izkušnjo.', datum_komentar: '2025-12-07', ocena_splosna: 5, ocena_udobje: 5, ocena_unikatnost: 5, ocena_lokacija: 4, ocena_cenovna_ugodnost: 3, ocena_dozivetje: 5, TK_uporabnik: 11, TK_prenocisce: 6 },
            { datum_komentar: '2025-01-15', ocena_splosna: 4, ocena_udobje: 3, ocena_unikatnost: 5, ocena_lokacija: 4, ocena_cenovna_ugodnost: 4, ocena_dozivetje: 4, TK_uporabnik: 1, TK_prenocisce: 7 },
            { datum_komentar: '2025-05-10', ocena_splosna: 5, ocena_udobje: 4, ocena_unikatnost: 5, ocena_lokacija: 5, ocena_cenovna_ugodnost: 4, ocena_dozivetje: 5, TK_uporabnik: 12, TK_prenocisce: 8  },
            { komentar: 'Helikopterski polet nad atoli je bil unikatno doživetje.', datum_komentar: '2025-05-20', ocena_splosna: 5, ocena_udobje: 5, ocena_unikatnost: 5, ocena_lokacija: 5, ocena_cenovna_ugodnost: 2, ocena_dozivetje: 5, TK_uporabnik: 13, TK_prenocisce: 10 },
            { datum_komentar: '2026-03-07', ocena_splosna: 5, ocena_udobje: 3, ocena_unikatnost: 5, ocena_lokacija: 5, ocena_cenovna_ugodnost: 3, ocena_dozivetje: 4, TK_uporabnik: 2, TK_prenocisce: 11 },
            { datum_komentar: '2025-07-07', ocena_splosna: 5, ocena_udobje: 4, ocena_unikatnost: 4, ocena_lokacija: 5, ocena_cenovna_ugodnost: 4, ocena_dozivetje: 4, TK_uporabnik: 1, TK_prenocisce: 12 },
            { komentar: 'Escape room je bil pravi hit za celotno skupino.', datum_komentar: '2025-09-05', ocena_splosna: 4, ocena_udobje: 3, ocena_unikatnost: 5, ocena_lokacija: 3, ocena_cenovna_ugodnost: 3, ocena_dozivetje: 4, TK_uporabnik: 9, TK_prenocisce: 13 },
            { datum_komentar: '2025-08-05', ocena_splosna: 5, ocena_udobje: 4, ocena_unikatnost: 5, ocena_lokacija: 4, ocena_cenovna_ugodnost: 4, ocena_dozivetje: 5, TK_uporabnik: 8, TK_prenocisce: 14 },
            { komentar: 'Gozdna hiška kot iz Hobita. Najlepši vikend v življenju!', datum_komentar: '2025-02-15', ocena_splosna: 5, ocena_udobje: 5, ocena_unikatnost: 5, ocena_lokacija: 4, ocena_cenovna_ugodnost: 5, ocena_dozivetje: 5, TK_uporabnik: 3, TK_prenocisce: 15 },
            { datum_komentar: '2026-10-06', ocena_splosna: 5, ocena_udobje: 4, ocena_unikatnost: 5, ocena_lokacija: 5, ocena_cenovna_ugodnost: 3, ocena_dozivetje: 5, TK_uporabnik: 10, TK_prenocisce: 16 },
            { komentar: 'Vožnja z jelensko vprego skozi gozd je bila kot iz pravljice.', datum_komentar: '2025-12-27', ocena_splosna: 5, ocena_udobje: 4, ocena_unikatnost: 5, ocena_lokacija: 4, ocena_cenovna_ugodnost: 3, ocena_dozivetje: 5, TK_uporabnik: 12, TK_prenocisce: 17 },
            { datum_komentar: '2026-07-05', ocena_splosna: 5, ocena_udobje: 3, ocena_unikatnost: 5, ocena_lokacija: 5, ocena_cenovna_ugodnost: 4, ocena_dozivetje: 5, TK_uporabnik: 15, TK_prenocisce: 21 },
            { komentar: 'Grad je impresiven, a pot do njega je precej zahtevna z avtom. Hvala za izkušnjo.', datum_komentar: '2025-02-06', ocena_splosna: 4, ocena_udobje: 4, ocena_unikatnost: 5, ocena_lokacija: 3, ocena_cenovna_ugodnost: 4, ocena_dozivetje: 4, TK_uporabnik: 5, TK_prenocisce: 3 },
            { komentar: 'Kupola je čarobna, a smo imeli smolo z oblačnim vremenom in tako nismo uspeli videti severnega sija, a kljub vsemu lepa izkušnja.', datum_komentar: '2025-12-07', ocena_splosna: 4, ocena_udobje: 5, ocena_unikatnost: 5, ocena_lokacija: 4, ocena_cenovna_ugodnost: 3, ocena_dozivetje: 4, TK_uporabnik: 9, TK_prenocisce: 6 },
            { datum_komentar: '2025-05-10', ocena_splosna: 4, ocena_udobje: 3, ocena_unikatnost: 5, ocena_lokacija: 4, ocena_cenovna_ugodnost: 3, ocena_dozivetje: 4, TK_uporabnik: 5, TK_prenocisce: 8 },
            { komentar: 'Hišica je bila res posebna, a vlaga in insekti so bili precej moteči.', datum_komentar: '2024-12-05', ocena_splosna: 3, ocena_udobje: 2, ocena_unikatnost: 5, ocena_lokacija: 4, ocena_cenovna_ugodnost: 3, ocena_dozivetje: 4, TK_uporabnik: 9, TK_prenocisce: 8 },
            { komentar: 'Neverjetna lokacija, a bungalov je bil za ceno nekoliko premajhen.', datum_komentar: '2024-12-15', ocena_splosna: 4, ocena_udobje: 4, ocena_unikatnost: 5, ocena_lokacija: 5, ocena_cenovna_ugodnost: 3, ocena_dozivetje: 4, TK_uporabnik: 1, TK_prenocisce: 9 },
            { datum_komentar: '2025-05-20', ocena_splosna: 4, ocena_udobje: 4, ocena_unikatnost: 5, ocena_lokacija: 5, ocena_cenovna_ugodnost: 2, ocena_dozivetje: 4, TK_uporabnik: 14, TK_prenocisce: 10 },
            { komentar: 'Puščava je bila čarobna, a suša in mraz ponoči nista bila prijetna. Dobra izkušnja za pustolovce.', datum_komentar: '2025-06-06', ocena_splosna: 4, ocena_udobje: 3, ocena_unikatnost: 5, ocena_lokacija: 4, ocena_cenovna_ugodnost: 3, ocena_dozivetje: 3, TK_uporabnik: 14, TK_prenocisce: 11 },
            { datum_komentar: '2026-03-07', ocena_splosna: 3, ocena_udobje: 3, ocena_unikatnost: 4, ocena_lokacija: 4, ocena_cenovna_ugodnost: 3, ocena_dozivetje: 3, TK_uporabnik: 9, TK_prenocisce: 11 },
            { komentar: 'Iglu je čudovit, a ponoči je zelo hladno kljub ogrevanju. Zajtrk je bil odličen.', datum_komentar: '2026-02-17', ocena_splosna: 4, ocena_udobje: 3, ocena_unikatnost: 5, ocena_lokacija: 4, ocena_cenovna_ugodnost: 3, ocena_dozivetje: 4, TK_uporabnik: 1, TK_prenocisce: 17 },
            { datum_komentar: '2026-11-06', ocena_splosna: 4, ocena_udobje: 4, ocena_unikatnost: 5, ocena_lokacija: 4, ocena_cenovna_ugodnost: 3, ocena_dozivetje: 4, TK_uporabnik: 11, TK_prenocisce: 17 },
            { komentar: 'Zvezdnato nebo nad kupolo je bilo neverjetno. Kamelji izlet je bil kratek za ceno.', datum_komentar: '2025-09-20', ocena_splosna: 4, ocena_udobje: 4, ocena_unikatnost: 5, ocena_lokacija: 4, ocena_cenovna_ugodnost: 3, ocena_dozivetje: 4, TK_uporabnik: 6, TK_prenocisce: 18 },
            { datum_komentar: '2026-04-15', ocena_splosna: 5, ocena_udobje: 4, ocena_unikatnost: 5, ocena_lokacija: 5, ocena_cenovna_ugodnost: 3, ocena_dozivetje: 5, TK_uporabnik: 3, TK_prenocisce: 18 },
            { datum_komentar: '2026-10-06', ocena_splosna: 5, ocena_udobje: 4, ocena_unikatnost: 5, ocena_lokacija: 5, ocena_cenovna_ugodnost: 4, ocena_dozivetje: 5, TK_uporabnik: 3, TK_prenocisce: 16 },
            { datum_komentar: '2026-07-06', ocena_splosna: 5, ocena_udobje: 4, ocena_unikatnost: 5, ocena_lokacija: 5, ocena_cenovna_ugodnost: 4, ocena_dozivetje: 5, TK_uporabnik: 9, TK_prenocisce: 21 },
        ];

        await knex('Komentar').insert(Komentar);
        console.log('Komentarji uspesno dodani.');

    } catch (err) {
        console.log('Err', err);
        throw err;
    } finally {
        knex.destroy();
    }
}

napolniBazo();
