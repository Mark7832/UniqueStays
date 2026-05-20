# UniqueStays - Povezava z bazo podatkov

Sistem za prikaz podatkov o prenočiščih iz MySQL baze podatkov.

## 📋 Predpogoji

Preden začneš, se prepričaj, da imaš nameščeno:
- **Node.js** (različica 14 ali novejša)
- **MySQL** (različica 5.7 ali novejša)
- **npm** (običajno se namesti skupaj z Node.js)

## 🚀 Namestitev

### 1. Ustvari bazo podatkov

```bash
# Zaženi ustvari_tabele.js datoteko za kreiranje baze in tabel
node ustvari_tabele.js
```

To bo ustvarilo bazo `uniquestays` z vsemi potrebnimi tabelami in podatki.

### 2. Namesti odvisnosti

```bash
npm install
```

To bo namestilo vse potrebne pakete:
- express (spletni strežnik)
- cors (za cross-origin zahteve)
- knex (SQL query builder)
- mysql2 (MySQL gonilnik)

### 3. Prilagodi nastavitve povezave (če je potrebno)

Odpri `server.js` in prilagodi nastavitve povezave v MySQL:

```javascript
const db = knex({
    client: 'mysql2',
    connection: {
        host: '127.0.0.1',
        user: 'root',           // tvoje MySQL uporabniško ime
        password: 'geslo',      // tvoje MySQL geslo
        database: 'uniquestays'
    }
});
```

## 🎯 Zagon aplikacije

### 1. Zaženi backend strežnik

```bash
node server.js
```

ali za razvojni način z avtomatskim ponovno zagonom:

```bash
npm run dev
```

Strežnik bo tekel na `http://localhost:3000`

### 2. Odpri HTML stran

Odpri `predjama-connected.html` v spletnem brskalniku. Stran bo avtomatsko naložila podatke iz baze.

**POMEMBNO:** HTML stran mora biti odprta s HTTP strežnikom (ne direktno iz datotečnega sistema), da CORS deluje pravilno. Lahko uporabiš:

#### Možnost A: Live Server (VSCode razširitev)
1. Namesti "Live Server" razširitev v VSCode
2. Desni klik na `predjama-connected.html`
3. Izberi "Open with Live Server"

#### Možnost B: Python HTTP strežnik
```bash
# Python 3
python -m http.server 8000

# Nato odpri: http://localhost:8000/predjama-connected.html
```

#### Možnost C: Node.js HTTP strežnik
```bash
npx http-server -p 8000

# Nato odpri: http://localhost:8000/predjama-connected.html
```

## 📡 API Endpoints

Backend ponuja naslednje API endpoint-e:

### Pridobi podatke o enem prenočišču
```
GET /api/prenocisce/:id
```

Vrne:
- Osnovne podatke o prenočišču
- Slike
- Doživetja
- Komentarje z uporabniki
- Povprečno oceno

Primer: `http://localhost:3000/api/prenocisce/2`

### Pridobi vsa prenočišča
```
GET /api/prenocisca
```

Vrne seznam vseh prenočišč s cover slikami.

Primer: `http://localhost:3000/api/prenocisca`

## 🗂️ Struktura projekta

```
.
├── server.js                    # Backend Express strežnik
├── predjama-connected.html      # Spletna stran z JS za nalaganje podatkov
├── package.json                 # NPM konfiguracija
├── ustvari_tabele.js           # Skript za kreiranje baze (original)
└── README.md                    # Ta datoteka
```

## 🔧 Reševanje težav

### Problem: "Cannot GET /api/prenocisce/2"
- Prepričaj se, da je backend strežnik zagnan
- Preveri ali je port 3000 prost

### Problem: "CORS error"
- Prepričaj se, da odpiraš HTML preko HTTP strežnika, ne direktno iz datoteke
- Preveri, da `cors` paket je nameščen

### Problem: "Error: connect ECONNREFUSED"
- Prepričaj se, da je MySQL strežnik zagnan
- Preveri MySQL geslo in uporabniško ime v `server.js`

### Problem: Stran prikazuje "Nalaganje..."
- Odpri Developer Tools (F12) in preveri konzolo za napake
- Preveri, da je backend API dostopen na `http://localhost:3000`

## 📝 Prilagoditev za drug prenočišče

V `predjama-connected.html`, spremeni ID prenočišča:

```javascript
const PRENOCISCE_ID = 2; // Spremeni na ID želenega prenočišča
```

ID-ji prenočišč:
- 1: Alpine Ski Lodge (Švica)
- 2: Predjamski grad (Slovenija) ✓
- 3: Aurora Bubble Lodge (Islandija)
- 4: Cave Hideaway (Turčija)
- 5: Jungle Treehouse (Kostarika)
- 6: Under the sea hotel (Maldivi)
- 7: Quack & Coffee Houseboat (Nizozemska)
- 8: Sleepy Train Carriage (Francija)
- 9: Mushroom Forest Hut (Nova Zelandija)

## 🎨 Dodatne funkcionalnosti

Sistem dinamično nalaga:
- ✅ Osnovne podatke o prenočišču
- ✅ Cene, kapacitete in ocene
- ✅ Seznam doživetij s cenami
- ✅ Komentarje gostov z ocenami
- ✅ Lokacijske podatke in koordinate

## 📞 Podpora

Če imaš kakršnekoli vprašanje ali težave, preveri:
1. Da so vsi predpogoji izpolnjeni
2. Da je MySQL strežnik zagnan
3. Da so MySQL poverilnice pravilne
4. Da uporabljaš HTTP strežnik za odpiranje HTML strani
