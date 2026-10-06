/* Modulo "Richiedi un appuntamento" - Madame Hairstylist
 * Nessun server, nessun dato salvato: costruisce un messaggio WhatsApp
 * già scritto e apre WhatsApp, dove Marta conferma o propone un altro orario.
 */
(function () {
  'use strict';

  var WA_NUMBER = '393514460171';
  var CLOSED_DAYS = [0, 1];            // 0 = domenica, 1 = lunedì
  var MAX_DAYS_AHEAD = 120;

  var SERVIZI = [
    'Piega', 'Taglio', 'Trattamento forma', 'Acconciatura',
    'Barba e capelli uomo', 'Colore', 'Effetti luce',
    'Trattamenti specifici per capelli', 'Taglio bambini e teenager',
    'Depilazione viso', 'Non so, ho bisogno di un consiglio'
  ];

  var FASCE = {
    mattina: 'mattina',
    pomeriggio: 'pomeriggio',
    indifferente: 'mattina o pomeriggio, indifferente'
  };

  var GIORNI = ['domenica', 'lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato'];
  var MESI = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio',
              'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'];

  /* ---------- funzioni pure (testabili) ---------- */

  function clean(str, max) {
    return String(str || '')
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
      .replace(/[ \t]+/g, ' ')
      .trim()
      .slice(0, max);
  }

  function parseDate(value) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || '');
    if (!m) return null;
    var y = +m[1], mo = +m[2] - 1, d = +m[3];
    var date = new Date(y, mo, d);
    if (date.getFullYear() !== y || date.getMonth() !== mo || date.getDate() !== d) return null;
    return date;
  }

  function startOfDay(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  function toInputValue(date) {
    // data LOCALE (toISOString userebbe l'UTC e sbaglierebbe il giorno la sera)
    var mm = String(date.getMonth() + 1).padStart(2, '0');
    var dd = String(date.getDate()).padStart(2, '0');
    return date.getFullYear() + '-' + mm + '-' + dd;
  }

  function formatDate(date) {
    return GIORNI[date.getDay()] + ' ' + date.getDate() + ' ' + MESI[date.getMonth()];
  }

  function validate(raw, now) {
    var errors = {};
    var data = {
      nome: clean(raw.nome, 60),
      servizio: clean(raw.servizio, 80),
      giorno: clean(raw.giorno, 10),
      fascia: clean(raw.fascia, 20),
      note: clean(raw.note, 300)
    };
    var today = startOfDay(now || new Date());

    if (data.nome.length < 2) errors.nome = 'Scrivi il tuo nome.';
    if (SERVIZI.indexOf(data.servizio) === -1) errors.servizio = 'Scegli un servizio.';

    var date = parseDate(data.giorno);
    if (!date) {
      errors.giorno = 'Scegli un giorno.';
    } else if (date < today) {
      errors.giorno = 'Questo giorno è già passato, scegline un altro.';
    } else if (date > new Date(today.getFullYear(), today.getMonth(), today.getDate() + MAX_DAYS_AHEAD)) {
      errors.giorno = 'Scegli una data nei prossimi 4 mesi.';
    } else if (CLOSED_DAYS.indexOf(date.getDay()) !== -1) {
      errors.giorno = 'Il ' + GIORNI[date.getDay()] + ' il salone è chiuso, scegli un altro giorno.';
    }

    if (!Object.prototype.hasOwnProperty.call(FASCE, data.fascia)) {
      errors.fascia = 'Scegli mattina, pomeriggio o indifferente.';
    }

    return { ok: Object.keys(errors).length === 0, errors: errors, data: data, date: date };
  }

  function buildMessage(data, date) {
    var lines = [
      'Ciao Marta! Sono ' + data.nome + '.',
      'Vorrei richiedere un appuntamento per: ' + data.servizio + '.',
      'Giorno: ' + formatDate(date),
      'Orario: ' + FASCE[data.fascia]
    ];
    if (data.note) lines.push('Note: ' + data.note);
    lines.push('Aspetto la tua conferma, grazie!');
    return lines.join('\n');
  }

  function buildUrl(message) {
    return 'https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(message);
  }

  /* ---------- parte DOM ---------- */

  function init() {
    var form = document.getElementById('prenota-form');
    if (!form) return;

    var fields = ['nome', 'servizio', 'giorno', 'fascia', 'note'];
    var status = document.getElementById('prenota-status');
    var fallback = document.getElementById('prenota-fallback');
    var dateInput = form.elements.giorno;

    var today = startOfDay(new Date());
    dateInput.min = toInputValue(today);
    dateInput.max = toInputValue(new Date(today.getFullYear(), today.getMonth(), today.getDate() + MAX_DAYS_AHEAD));

    function setError(name, message) {
      var el = form.elements[name];
      var out = document.getElementById('prenota-err-' + name);
      if (out) out.textContent = message || '';
      if (el && el.setAttribute) {
        if (message) el.setAttribute('aria-invalid', 'true');
        else el.removeAttribute('aria-invalid');
      }
    }

    fields.forEach(function (name) {
      // querySelectorAll: "fascia" è un gruppo di radio, form.elements non basta
      var list = form.querySelectorAll('[name="' + name + '"]');
      Array.prototype.forEach.call(list, function (el) {
        var evt = (el.tagName === 'SELECT' || el.type === 'date' || el.type === 'radio') ? 'change' : 'input';
        el.addEventListener(evt, function () { setError(name, ''); });
      });
    });

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      status.textContent = '';
      fallback.hidden = true;

      var result = validate({
        nome: form.elements.nome.value,
        servizio: form.elements.servizio.value,
        giorno: form.elements.giorno.value,
        fascia: (form.querySelector('input[name="fascia"]:checked') || {}).value,
        note: form.elements.note.value
      }, new Date());

      fields.forEach(function (name) { setError(name, result.errors[name]); });

      if (!result.ok) {
        var first = fields.filter(function (n) { return result.errors[n]; })[0];
        var target = form.elements[first];
        if (target && target.focus) target.focus();
        status.textContent = 'Controlla i campi evidenziati.';
        return;
      }

      var url = buildUrl(buildMessage(result.data, result.date));
      var win = window.open(url, '_blank', 'noopener');
      if (!win) { window.location.href = url; }

      fallback.href = url;
      fallback.hidden = false;
      status.textContent = 'Si apre WhatsApp con il messaggio già scritto: premi Invia. ' +
        'La richiesta diventa un appuntamento solo quando Marta ti conferma.';
    });
  }

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      validate: validate, buildMessage: buildMessage, buildUrl: buildUrl,
      parseDate: parseDate, formatDate: formatDate, toInputValue: toInputValue,
      SERVIZI: SERVIZI, FASCE: FASCE, WA_NUMBER: WA_NUMBER
    };
  }
})();
