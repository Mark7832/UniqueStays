function prikaziSlike(input) {
            if (!input) return;
            var seznam = document.getElementById('slike-seznam');
            seznam.innerHTML = '';

            if (!input.files || input.files.length === 0) return;

            document.getElementById('cover-index').value = '0';

            for (var i = 0; i < input.files.length; i++) {
                var file = input.files[i];
                var url = URL.createObjectURL(file);
                var je_cover = (i === 0);

                var vrstica = document.createElement('div');
                vrstica.className = 'flex items-center gap-4 p-3 rounded-2xl border bg-slate-50 ' + (je_cover ? 'border-teal-400' : 'border-slate-200');
                vrstica.id = 'slika-vrstica-' + i;

                vrstica.innerHTML =
                    '<img src="' + url + '" class="w-16 h-12 object-cover rounded-xl flex-shrink-0" />' +
                    '<span class="flex-1 text-sm font-semibold text-slate-600 truncate">' + file.name + '</span>' +
                    '<button type="button" onclick="oznaCiCover(' + i + ')" id="zvezda-' + i + '" class="text-xl transition-transform hover:scale-125 ' + (je_cover ? 'text-yellow-400' : 'text-slate-300') + '" title="Nastavi kot naslovno sliko">' +
                        (je_cover ? '★' : '☆') +
                    '</button>' +
                    (je_cover ? '<span class="text-xs font-bold text-teal-600 bg-teal-50 px-2 py-1 rounded-full" id="cover-znak-' + i + '">Naslovna slika</span>' : '<span class="text-xs text-slate-300 px-2 py-1 rounded-full" id="cover-znak-' + i + '"></span>');

                seznam.appendChild(vrstica);
            }
        }

        function oznaCiCover(index) {
            var input = document.getElementById('slike-input');
            var skupaj = input.files ? input.files.length : 0;

            document.getElementById('cover-index'.value = index);

            for (var i = 0; i < skupaj; i++) {
                var je_ta = (i === index);
                var vrstica = document.getElementById('slika-vrstica-' + i);
                var zvezda = document.getElementById('zvezda-' + i);
                var znak = document.getElementById('cover-znak-' + i);

                if (vrstica) vrstica.className = 'flex items-center gap-4 p-3 rounded-2xl border bg-slate-50 ' + (je_ta ? 'border-teal-400' : 'border-slate-200');
                if (zvezda) {
                    zvezda.textContent = je_ta ? '★' : '☆';
                    zvezda.className = 'text-xl transition-transform hover:scale-125 ' + (je_ta ? 'text-yellow-400' : 'text-slate-300');
                }
                if (znak) {
                    znak.textContent = je_ta ? 'Naslovna slika' : '';
                    znak.className = je_ta ? 'text-xs font-bold text-teal-600 bg-teal-50 px-2 py-1 rounded-full' : 'text-xs text-slate-300 px-2 py-1 rounded-full';
                }
            }
        }

        function dodajTermin() {
            var container = document.getElementById('termini-container');

            var novDiv = document.createElement('div');
            novDiv.className = 'termin-vnos grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200 relative';

            novDiv.innerHTML =
                '<div>' +
                    '<label class="block text-xs uppercase tracking-widest font-bold text-slate-400 mb-2">Datum od</label>' +
                    '<input type="date" name="termin_od[]" class="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white font-semibold outline-none focus:border-teal-400 transition" />' +
                '</div>' +
                '<div>' +
                    '<label class="block text-xs uppercase tracking-widest font-bold text-slate-400 mb-2">Datum do</label>' +
                    '<input type="date" name="termin_do[]" class="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white font-semibold outline-none focus:border-teal-400 transition" />' +
                '</div>' +
                '<div class="relative">' +
                    '<label class="block text-xs uppercase tracking-widest font-bold text-slate-400 mb-2">Razlog</label>' +
                    '<input type="text" name="termin_razlog[]" placeholder="Vzdrževanje" class="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white font-semibold outline-none focus:border-teal-400 transition" />' +
                    '<button type="button" onclick="odstraniTermin(this)" class="absolute -top-1 -right-1 text-slate-400 hover:text-red-500 font-bold text-xs transition">Odstrani</button>' +
                '</div>';

            container.appendChild(novDiv);
        }

        function odstraniTermin(gumb) {
            gumb.closest('.termin-vnos').remove();
        }

        function prikaziPredogled(input) {
            var wrapper = input.nextElementSibling;
            if (!input.files || input.files.length === 0) {
                wrapper.classList.add('hidden');
                return;
            }
            var url = URL.createObjectURL(input.files[0]);
            wrapper.querySelector('img').src = url;
            wrapper.classList.remove('hidden');
        }