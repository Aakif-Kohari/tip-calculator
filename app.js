(function (root) {
  'use strict';

  var MIN_PEOPLE = 1;
  var MAX_PEOPLE = 50;

  /**
   * Pure calculation. All money is handled in minor units (paise/cents)
   * so floating point never leaks into the totals.
   */
  function calculate(input) {
    var billMinor = Math.round(input.bill * 100);
    var tipMinor = Math.round((billMinor * input.tipPercent) / 100);
    var totalMinor = billMinor + tipMinor;
    var perPersonMinor;

    if (input.roundUp) {
      perPersonMinor = Math.ceil(totalMinor / (input.people * 100)) * 100;
      totalMinor = perPersonMinor * input.people;
      tipMinor = totalMinor - billMinor;
    } else {
      perPersonMinor = Math.ceil(totalMinor / input.people);
    }

    return {
      billMinor: billMinor,
      tipMinor: tipMinor,
      totalMinor: totalMinor,
      perPersonMinor: perPersonMinor,
      effectiveTipPercent: billMinor === 0 ? 0 : (tipMinor / billMinor) * 100
    };
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { calculate: calculate };
  }

  if (typeof document === 'undefined') return;

  var LOCALES = { INR: 'en-IN', USD: 'en-US', EUR: 'en-IE', GBP: 'en-GB' };

  var el = {
    bill: document.getElementById('bill'),
    currency: document.getElementById('currency'),
    tipRadios: Array.prototype.slice.call(document.querySelectorAll('input[name="tip"]')),
    customTip: document.getElementById('customTip'),
    people: document.getElementById('people'),
    peopleUp: document.getElementById('peopleUp'),
    peopleDown: document.getElementById('peopleDown'),
    roundUp: document.getElementById('roundUp'),
    reset: document.getElementById('reset'),
    billError: document.getElementById('billError'),
    tipError: document.getElementById('tipError'),
    peopleError: document.getElementById('peopleError'),
    outBill: document.getElementById('outBill'),
    outTip: document.getElementById('outTip'),
    outTotal: document.getElementById('outTotal'),
    outEach: document.getElementById('outEach'),
    outNote: document.getElementById('outNote'),
    eachLabel: document.getElementById('eachLabel'),
    tipLabel: document.getElementById('tipLabel'),
    themeToggle: document.getElementById('themeToggle'),
    themeLabel: document.getElementById('themeLabel')
  };

  function formatter() {
    var code = el.currency.value;
    return new Intl.NumberFormat(LOCALES[code] || 'en-US', { style: 'currency', currency: code });
  }

  function money(minor, fmt) {
    return fmt.format(minor / 100);
  }

  function showError(node, input, message) {
    if (message) {
      node.textContent = message;
      node.hidden = false;
      if (input) input.setAttribute('aria-invalid', 'true');
    } else {
      node.textContent = '';
      node.hidden = true;
      if (input) input.removeAttribute('aria-invalid');
    }
  }

  function readTipPercent() {
    var custom = el.customTip.value.trim();
    if (custom !== '') return Number(custom);
    var checked = el.tipRadios.filter(function (r) { return r.checked; })[0];
    return checked ? Number(checked.value) : 0;
  }

  function clearOutputs(label) {
    el.outBill.textContent = '—';
    el.outTip.textContent = '—';
    el.outTotal.textContent = '—';
    el.outEach.textContent = '—';
    el.outNote.textContent = '';
    el.tipLabel.textContent = 'Tip';
    el.eachLabel.textContent = label;
  }

  function update() {
    var billRaw = el.bill.value.trim();
    var bill = billRaw === '' ? null : Number(billRaw);
    var tip = readTipPercent();
    var people = Number(el.people.value);

    var billMsg = '';
    var tipMsg = '';
    var peopleMsg = '';

    if (bill !== null && (!isFinite(bill) || bill < 0)) {
      billMsg = 'Enter a bill of 0 or more.';
    }
    if (!isFinite(tip) || tip < 0 || tip > 100) {
      tipMsg = 'Enter a tip between 0 and 100.';
    }
    if (!Number.isInteger(people) || people < MIN_PEOPLE || people > MAX_PEOPLE) {
      peopleMsg = 'Enter a whole number from ' + MIN_PEOPLE + ' to ' + MAX_PEOPLE + '.';
    }

    showError(el.billError, el.bill, billMsg);
    showError(el.tipError, el.customTip, tipMsg);
    showError(el.peopleError, el.people, peopleMsg);

    var p = Number.isInteger(people) ? people : MIN_PEOPLE;
    el.peopleDown.disabled = p <= MIN_PEOPLE;
    el.peopleUp.disabled = p >= MAX_PEOPLE;

    if (billMsg || tipMsg || peopleMsg) {
      clearOutputs('Fix the highlighted field');
      return;
    }
    if (bill === null || bill === 0) {
      clearOutputs('Enter a bill to see the split');
      return;
    }

    var fmt = formatter();
    var r = calculate({ bill: bill, tipPercent: tip, people: people, roundUp: el.roundUp.checked });
    var shownPercent = Math.round(r.effectiveTipPercent * 10) / 10;

    el.outBill.textContent = money(r.billMinor, fmt);
    el.outTip.textContent = money(r.tipMinor, fmt);
    el.outTotal.textContent = money(r.totalMinor, fmt);
    el.tipLabel.textContent = 'Tip (' + shownPercent + '%)';
    el.outEach.textContent = money(r.perPersonMinor, fmt);

    if (people === 1) {
      el.eachLabel.textContent = 'You pay';
      el.outNote.textContent = '';
    } else {
      el.eachLabel.textContent = 'Each person pays';
      el.outNote.textContent = 'Split ' + people + ' ways';
    }
    if (el.roundUp.checked && r.effectiveTipPercent !== tip) {
      el.outNote.textContent += (el.outNote.textContent ? ' · ' : '') + 'Rounded up';
    }
  }

  function setPeople(n) {
    el.people.value = String(Math.min(MAX_PEOPLE, Math.max(MIN_PEOPLE, n)));
    update();
  }

  el.bill.addEventListener('input', update);
  el.currency.addEventListener('change', update);
  el.roundUp.addEventListener('change', update);
  el.people.addEventListener('input', update);

  el.tipRadios.forEach(function (radio) {
    radio.addEventListener('change', function () {
      el.customTip.value = '';
      update();
    });
  });

  el.customTip.addEventListener('input', function () {
    if (el.customTip.value.trim() !== '') {
      el.tipRadios.forEach(function (r) { r.checked = false; });
    } else if (!el.tipRadios.some(function (r) { return r.checked; })) {
      document.getElementById('tip10').checked = true;
    }
    update();
  });

  el.peopleUp.addEventListener('click', function () {
    setPeople((Number(el.people.value) || MIN_PEOPLE) + 1);
  });
  el.peopleDown.addEventListener('click', function () {
    setPeople((Number(el.people.value) || MIN_PEOPLE) - 1);
  });

  el.reset.addEventListener('click', function () {
    el.bill.value = '';
    el.customTip.value = '';
    document.getElementById('tip10').checked = true;
    el.people.value = '1';
    el.roundUp.checked = false;
    update();
    el.bill.focus();
  });

  /* Theme */
  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    var dark = theme === 'dark';
    el.themeToggle.setAttribute('aria-pressed', String(dark));
    el.themeLabel.textContent = dark ? 'Dark mode on' : 'Dark mode';
  }

  el.themeToggle.addEventListener('click', function () {
    var next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    try { localStorage.setItem('tip-theme', next); } catch (e) {}
  });

  applyTheme(document.documentElement.getAttribute('data-theme') || 'light');
  update();
})(typeof window !== 'undefined' ? window : this);
