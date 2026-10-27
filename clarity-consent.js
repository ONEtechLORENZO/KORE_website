(function () {
  'use strict';

  var PROJECT_ID = 'z3sy7q9gz9';
  var STORAGE_KEY = 'kore-clarity-consent-v1';
  var SCRIPT_ID = 'kore-clarity-script';
  var BANNER_ID = 'kore-clarity-consent';
  var MANAGE_ID = 'kore-clarity-manage';
  var PUBLIC_PATHS = ['/', '/index.html', '/sito.html'];
  var PRIVATE_HASHES = [
    '#contatti', '#privacy', '#richiedi-demo', '#pricing', '#prezzi', '#configura',
    '#preventivo', '#contratto', '#pagamento', '#fatto'
  ];
  var clarityStarted = false;

  function language() {
    try {
      return new URLSearchParams(window.location.search).get('lang') === 'en' ? 'en' : 'it';
    } catch (error) {
      return document.documentElement.lang === 'en' ? 'en' : 'it';
    }
  }

  function text(it, en) {
    return language() === 'en' ? en : it;
  }

  function hasSafeQuery() {
    try {
      var params = new URLSearchParams(window.location.search);
      var safe = true;
      params.forEach(function (value, key) {
        if (key !== 'lang' || (value !== 'it' && value !== 'en')) safe = false;
      });
      return safe;
    } catch (error) {
      return false;
    }
  }

  function isEligibleRoute() {
    var path = window.location.pathname || '/';
    var hash = (window.location.hash || '').toLowerCase();
    return PUBLIC_PATHS.indexOf(path) !== -1 &&
      PRIVATE_HASHES.indexOf(hash) === -1 && hasSafeQuery();
  }

  function readConsent() {
    try {
      var value = window.localStorage.getItem(STORAGE_KEY);
      return value === 'granted' || value === 'denied' ? value : null;
    } catch (error) {
      return null;
    }
  }

  function writeConsent(value) {
    try {
      window.localStorage.setItem(STORAGE_KEY, value);
    } catch (error) {
      /* The current page still respects the choice if storage is unavailable. */
    }
  }

  function setClarityConsent(analytics) {
    if (typeof window.clarity !== 'function') return;
    window.clarity('consentv2', {
      ad_Storage: 'denied',
      analytics_Storage: analytics
    });
  }

  function startClarity() {
    if (clarityStarted || !isEligibleRoute() || readConsent() !== 'granted') return;
    if (document.getElementById(SCRIPT_ID) || document.querySelector('script[src*="clarity.ms/tag/' + PROJECT_ID + '"]')) {
      clarityStarted = true;
      setClarityConsent('granted');
      return;
    }

    clarityStarted = true;
    document.documentElement.setAttribute('data-clarity-mask', 'true');

    /* Official Microsoft Clarity manual installation snippet. */
    (function(c,l,a,r,i,t,y){
      c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
      t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
      t.id=SCRIPT_ID;
      y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
    })(window, document, "clarity", "script", PROJECT_ID);

    setClarityConsent('granted');
  }

  function removeBanner() {
    var banner = document.getElementById(BANNER_ID);
    if (banner) banner.remove();
  }

  function showManageButton() {
    if (!isEligibleRoute() || document.getElementById(MANAGE_ID)) return;
    var button = document.createElement('button');
    button.type = 'button';
    button.id = MANAGE_ID;
    button.className = 'kore-clarity-manage';
    button.textContent = text('Preferenze cookie', 'Cookie preferences');
    button.addEventListener('click', showBanner);
    document.body.appendChild(button);
  }

  function choose(value) {
    writeConsent(value);
    removeBanner();
    if (value === 'granted') {
      startClarity();
      showManageButton();
      return;
    }
    if (clarityStarted || typeof window.clarity === 'function') {
      setClarityConsent('denied');
      window.location.reload();
      return;
    }
    showManageButton();
  }

  function showBanner() {
    if (!isEligibleRoute()) return;
    removeBanner();
    var banner = document.createElement('section');
    banner.id = BANNER_ID;
    banner.className = 'kore-clarity-consent';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-modal', 'true');
    banner.setAttribute('aria-labelledby', 'kore-clarity-title');
    banner.innerHTML =
      '<div class="kore-clarity-copy">' +
        '<strong id="kore-clarity-title">' + text('Cookie analitici', 'Analytics cookies') + '</strong>' +
        '<p>' + text(
          'Con il tuo consenso, Microsoft Clarity ci aiuta a capire come viene usato il sito tramite registrazioni di sessione e mappe di calore. Il contenuto viene mascherato; le aree riservate, i documenti e i moduli sensibili sono esclusi. I cookie pubblicitari restano disattivati.',
          'With your consent, Microsoft Clarity helps us understand how the website is used through session recordings and heatmaps. Content is masked; private areas, documents, and sensitive forms are excluded. Advertising cookies remain disabled.'
        ) + '</p>' +
        '<p class="kore-clarity-links"><a href="/privacy-marketing/" target="_blank" rel="noopener">' + text('Informativa privacy e cookie', 'Privacy and cookie notice') + '</a>' +
        '<span aria-hidden="true"> &middot; </span><a href="https://privacy.microsoft.com/privacystatement" target="_blank" rel="noopener noreferrer">Microsoft Privacy</a></p>' +
      '</div>' +
      '<div class="kore-clarity-actions">' +
        '<button type="button" data-clarity-choice="denied">' + text('Rifiuta', 'Reject') + '</button>' +
        '<button type="button" class="is-primary" data-clarity-choice="granted">' + text('Accetta analitici', 'Accept analytics') + '</button>' +
      '</div>';
    banner.querySelector('[data-clarity-choice="denied"]').addEventListener('click', function () { choose('denied'); });
    banner.querySelector('[data-clarity-choice="granted"]').addEventListener('click', function () { choose('granted'); });
    document.body.appendChild(banner);
    banner.querySelector('[data-clarity-choice="denied"]').focus();
  }

  function handleRouteChange() {
    if (!isEligibleRoute()) {
      removeBanner();
      var manage = document.getElementById(MANAGE_ID);
      if (manage) manage.remove();
      if (clarityStarted) {
        setClarityConsent('denied');
        window.location.reload();
      }
      return;
    }
    if (readConsent() === 'granted') startClarity();
    else if (!readConsent()) showBanner();
    showManageButton();
  }

  function init() {
    window.addEventListener('hashchange', handleRouteChange);
    window.addEventListener('popstate', handleRouteChange);
    if (!isEligibleRoute()) return;
    var consent = readConsent();
    if (consent === 'granted') startClarity();
    else if (!consent) showBanner();
    showManageButton();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
