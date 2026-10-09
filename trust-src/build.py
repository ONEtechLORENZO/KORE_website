# -*- coding: utf-8 -*-
"""KORE Trust Center: genera la cartella trust/ (radice di trust.kore-hub.otech.one).

Uso:  python trust-src/build.py          (pagine + PDF; serve il server locale su 127.0.0.1:4010)
      python trust-src/build.py --no-pdf (solo pagine)

Come pubblicare una nuova versione di un documento:
  1. copiare content/<slug>/vX-Y.html in un nuovo file (es. v1-3.html) e modificarlo;
  2. aggiungere la versione IN CIMA a "versions" del documento qui sotto;
  3. impostare la versione precedente a stato 'superata';
  4. lanciare lo script.
REGOLA: le versioni vecchie (file in content/ e righe in DOCS) non si cancellano MAI:
ogni contratto rimanda all'indirizzo permanente di una versione specifica.
Il PDF di una versione non in bozza non viene mai rigenerato se esiste già.
"""
import html, os, re, shutil, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(os.path.dirname(HERE), 'trust')
SITE = 'https://trust.kore-hub.otech.one/'
LOCAL = 'http://127.0.0.1:4010/trust/'
EDGE = r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'

# stato: 'bozza' | 'vigore' | 'aggiornamento' (indicare 'nuova_efficacia') | 'superata'
# pub / eff: date in chiaro ('8 ottobre 2026'); vuote = "Da definire"
# pdf / pdf_src (facoltativi): nome del PDF scaricabile e file ufficiale in trust-src/ da copiare al posto di quello generato
DOCS = [
 dict(slug='termini-e-condizioni', group='Contrattuali', title='Condizioni Contrattuali Centralizzate',
      sub='Corpus contrattuale generale applicabile ai servizi, alle piattaforme, ai moduli, alle API e alle soluzioni tecnologiche forniti da One Tech S.r.l., inclusa KORE',
      versions=[dict(v='1.0', pub='9 ottobre 2026', eff='', status='vigore',
                     pdf='KORE_Condizioni_Contrattuali_Centralizzate_v1.0.pdf', pdf_src='pdf/KORE_Condizioni_Contrattuali_Centralizzate_v1.0.pdf')]),
 dict(slug='service-level-agreement', group='Contrattuali', title='Service Level Agreement',
      sub='SLA standard per i Servizi SaaS di One Tech S.r.l., inclusa KORE',
      versions=[dict(v='1.0', pub='9 ottobre 2026', eff='', status='vigore',
                     pdf='KORE_Service_Level_Agreement_v1.0.pdf', pdf_src='pdf/KORE_Service_Level_Agreement_v1.0.pdf')]),
 dict(slug='data-processing-agreement', group='Contrattuali', title='Data Processing Agreement',
      sub='Nomina a Responsabile del trattamento ai sensi dell’art. 28 del Regolamento (UE) 2016/679 - modello standard',
      versions=[dict(v='1.0', pub='9 ottobre 2026', eff='', status='vigore',
                     pdf='KORE_Data_Processing_Agreement_v1.0.pdf', pdf_src='pdf/KORE_Data_Processing_Agreement_v1.0.pdf')]),
 dict(slug='condizioni-uso-utenti', group='Piattaforma', title='Condizioni d’uso Utenti',
      sub='Per gli Utenti autorizzati della Piattaforma',
      versions=[dict(v='1.0', pub='9 ottobre 2026', eff='', status='vigore',
                     pdf='KORE_Condizioni_Uso_Utenti_v1.0.pdf', pdf_src='pdf/KORE_Condizioni_Uso_Utenti_v1.0.pdf')]),
 dict(slug='privacy-policy', group='Privacy', title='Informativa privacy Utenti',
      sub='Informativa ai sensi degli artt. 13 e 14 del Regolamento (UE) 2016/679 per gli operatori autorizzati ad accedere alla piattaforma KORE',
      versions=[dict(v='1.0', pub='9 ottobre 2026', eff='', status='vigore',
                     pdf='KORE_Informativa_Privacy_Utenti_v1.0.pdf', pdf_src='pdf/KORE_Informativa_Privacy_Utenti_v1.0.pdf')]),
 dict(slug='informativa-privacy-sito', group='Privacy', title='Informativa privacy del sito',
      sub='Informativa ai sensi degli artt. 13 e 14 del Regolamento (UE) 2016/679 per i visitatori del Trust Center KORE e per i contatti commerciali',
      versions=[dict(v='1.0', pub='9 ottobre 2026', eff='', status='vigore',
                     pdf='KORE_Informativa_Privacy_Sito_v1.0.pdf', pdf_src='pdf/KORE_Informativa_Privacy_Sito_v1.0.pdf')]),
 dict(slug='cookie-policy', group='Privacy', title='Cookie policy',
      sub='Informativa sull’uso di cookie e altri strumenti di tracciamento sul Trust Center KORE',
      versions=[dict(v='1.0', pub='9 ottobre 2026', eff='', status='vigore',
                     pdf='KORE_Cookie_Policy_v1.0.pdf', pdf_src='pdf/KORE_Cookie_Policy_v1.0.pdf')]),
]

PAGES = [  # pagine semplici, senza versioni
 dict(slug='uso-ai', title='Uso dell’AI in KORE', sub='Come e dove la piattaforma KORE utilizza l’intelligenza artificiale', src='uso-ai.html'),
 dict(slug='registro-modifiche', title='Registro delle modifiche', sub='Tutte le versioni pubblicate dei documenti KORE', src=None),
]

SUBPROCESSORS = dict(
 updated='9 ottobre 2026',  # data dell'ultimo aggiornamento dell'elenco
 rows=[  # (soggetto, servizio, ruolo privacy, paese/regione, garanzia trasferimento)
  ('Amazon Web Services EMEA SARL', 'hosting, database, cache, storage, backup, monitoraggio', 'Sub-responsabile',
   'UE - Francoforte (eu-central-1)', 'Non applicabile (SEE); per eventuali accessi extra SEE: EU-US Data Privacy Framework / Clausole Contrattuali Tipo'),
  ('Amazon Web Services EMEA SARL - Amazon Bedrock', 'modelli di intelligenza artificiale per l’agente conversazionale e le funzioni AI', 'Sub-responsabile',
   'UE - inferenza EU cross-region, endpoint Milano (eu-south-1)', 'Non applicabile (SEE); i dati non sono usati per addestrare i modelli'),
  ('Amazon Web Services EMEA SARL - Amazon SES', 'invio email', 'Sub-responsabile', 'UE', 'Non applicabile (SEE)'),
  ('Gupshup Inc.', 'canale WhatsApp e invio dei codici OTP', 'Sub-responsabile', 'Stati Uniti, UE e Asia (inclusa India)',
   'Stati Uniti: EU-US Data Privacy Framework; altri Paesi terzi: Clausole Contrattuali Tipo'),
  ('Cooabit S.r.l.', 'OCR ed estrazione dati da documenti', 'Sub-responsabile', 'UE',
   'Non applicabile (SEE); file e dati estratti cancellati 30 minuti dopo la chiusura della pratica'),
  ('Aruba PEC S.p.A.', 'invio di comunicazioni tramite PEC', 'Sub-responsabile', 'Italia', 'Non applicabile (SEE)'),
 ],
 others=[  # soggetti della filiera che non sono sub-responsabili: (soggetto, attivita', ruolo privacy)
  ('Meta Platforms Ireland Ltd (WhatsApp)', 'trasporto dei messaggi WhatsApp',
   'Sub-responsabile di Gupshup per la WhatsApp Business Platform; autonomo titolare per finalità proprie'),
  ('CRIF e altri Sistemi di Informazione Creditizia', 'consultazione SIC su istruzione del cliente', 'Autonomo titolare'),
  ('Compagnie assicurative indicate dal cliente', 'valutazione del rischio assicurativo', 'Autonomo titolare'),
 ],
 planned=[  # (nuovo sub-responsabile, servizio, data di inizio); vuoto = "Nessuna modifica pianificata."
 ],
)

SECURITY = [
 ('Infrastruttura', 'KORE è ospitata su Amazon Web Services nell’Unione Europea: applicazione, database, cache, storage e backup si trovano nella regione di Francoforte (eu-central-1); i modelli di intelligenza artificiale sono erogati tramite Amazon Bedrock con inferenza limitata a regioni dell’Unione Europea. I dati dei diversi clienti sono separati logicamente. I rilasci applicativi avvengono senza interruzione del servizio.'),
 ('Cifratura', 'Le comunicazioni con la piattaforma sono cifrate in transito mediante protocolli di trasporto sicuri (HTTPS/TLS). I dati sono cifrati a riposo tramite le funzionalità native dei servizi AWS utilizzati.'),
 ('Accessi e autenticazione', 'Gli accessi alla piattaforma avvengono con credenziali nominative e personali, con permessi assegnati per ruolo dal cliente. Il personale One Tech accede ai sistemi secondo il principio del minimo privilegio, con autenticazione forte per gli accessi amministrativi ove applicabile e revisione periodica delle abilitazioni. Gli operatori accettano le <a href="{{root}}condizioni-uso-utenti/">Condizioni d’uso Utenti</a> al primo accesso.'),
 ('Backup e continuità', 'Il database è in configurazione multi-AZ (più data center della stessa regione), con backup automatici che consentono il ripristino point-in-time fino a 14 giorni e snapshot manuali. La disponibilità della piattaforma è monitorata in modo continuativo. Valori garantiti di RPO e RTO sono previsti solo se concordati nell’Order Form.'),
 ('Gestione incidenti', 'Gli incidenti sono classificati per gravità (P1-P4) e gestiti secondo i tempi dello <a href="{{root}}service-level-agreement/#art-6">SLA</a>. Per gli incidenti critici (P1) il team di supporto aggiorna il cliente almeno ogni 3 ore lavorative fino al ripristino e può fornire una sintesi post-incidente. In caso di violazione di dati personali, One Tech avvisa il cliente entro 48 ore dalla conoscenza, come previsto dal <a href="{{root}}data-processing-agreement/#art-10">Data Processing Agreement</a>.'),
 ('Segnalazione vulnerabilità', 'Se ritieni di aver individuato una vulnerabilità, scrivi a <a href="mailto:support@otech.one?subject=Segnalazione%20di%20sicurezza">support@otech.one</a> con oggetto “Segnalazione di sicurezza”, descrivendo il problema e come riprodurlo. Prendiamo in carico le segnalazioni entro 1,5 Giorni Lavorativi. Ti chiediamo di non accedere a dati di terzi, non interrompere il servizio e non divulgare la vulnerabilità prima che sia stata risolta. Test di sicurezza attivi sulla piattaforma richiedono la preventiva autorizzazione scritta di One Tech.'),
]

COMPLIANCE = [  # (sigillo, titolo, descrizione, etichetta)
 ('GDPR', 'GDPR', 'Regolamento (UE) 2016/679', ''),
 ('ART.<br>28', 'Accordo DPA', 'One Tech S.r.l. come Responsabile del trattamento (art. 28)', ''),
 ('ISO<br>27001', 'ISO/IEC 27001', 'Sistema di gestione della sicurezza delle informazioni', 'Coming soon'),
 ('DORA', 'DORA readiness', 'Regolamento (UE) 2022/2554, resilienza operativa digitale', 'In progress'),
]

FOOT = ('<footer class="tr-foot"><span>One Tech S.r.l. &middot; Via Gustavo Fara 35, 20124 Milano &middot; P.IVA 10071971211 &middot; '
        'PEC <a href="mailto:One@pec.cloud">One@pec.cloud</a></span>'
        '<span><a href="{r}cookie-policy/">Cookie policy</a></span></footer>')

STATUS = {'bozza': ('Bozza', ''), 'vigore': ('Active', ' is-on'), 'aggiornamento': ('In aggiornamento', ' is-upd'), 'superata': ('Superata', ' is-old')}

ICON = {
 'right': '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg>',
 'down': '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12m0 0-5-5m5 5 5-5M4 19h16"/></svg>',
 'clock': '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
 'mail': '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>',
 'arrow': '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6"/></svg>',
 'doc': '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h6M9 9h2"/></svg>',
 'shield': '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 4.5 6v5.5c0 4.6 3.2 8.4 7.5 9.5 4.3-1.1 7.5-4.9 7.5-9.5V6z"/><path d="m8.8 12.2 2.3 2.3 4.3-4.6"/></svg>',
 'pdf': '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 12.5h6M9 16.5h4"/></svg>',
}
SEAL_ICON = {'GDPR': 'shield', 'Accordo DPA': 'doc'}
# loghi forniti dall'utente (file in trust/assets/logos/): hanno la precedenza sulle icone
SEAL_IMG = {'GDPR': 'gdpr.png', 'Accordo DPA': 'onetech.svg', 'ISO/IEC 27001': 'iso27001.png', 'DORA readiness': 'dora.png'}


def vkey(v): return 'v' + v['v'].replace('.', '-')
def date(d): return d or 'Da definire'
def pdf_name(doc, v): return v.get('pdf') or 'KORE_%s_%s.pdf' % (doc['slug'], vkey(v))
def current(doc): return doc['versions'][0]


def badge(v):
    label, cls = STATUS[v['status']]
    if v['status'] == 'aggiornamento' and v.get('nuova_efficacia'):
        label += ' &middot; dal ' + v['nuova_efficacia']
    return '<span class="tr-tag%s">%s</span>' % (cls, label)


def sections(doc, v):
    s = open(os.path.join(HERE, 'content', doc['slug'], vkey(v) + '.html'), encoding='utf-8').read()
    return s, re.findall(r'<h2><i>\d+</i>(.*?)</h2>', s)


CSS_V = __import__('hashlib').sha1(open(os.path.join(OUT, 'assets', 'legal.css'), 'rb').read()).hexdigest()[:10]


def head(title, r, desc=''):
    return ('<!DOCTYPE html>\n<html lang="it">\n<head>\n<meta charset="utf-8">\n'
            '<meta name="viewport" content="width=device-width,initial-scale=1">\n'
            '<!-- generato da trust-src/build.py: non modificare a mano -->\n'
            '<meta name="robots" content="noindex,nofollow">\n<title>%s</title>\n%s'
            '<link rel="icon" href="%sassets/favicon.svg" type="image/svg+xml">\n'
            # nessun cookie o local storage: la Cookie policy dichiara che il sito non memorizza nulla sul dispositivo
            # ?v= impronta del CSS: a ogni modifica i browser scaricano il foglio nuovo invece di usare quello in cache
            '<link rel="stylesheet" href="%sassets/legal.css?v=' + CSS_V + '">\n</head>\n<body>\n'
            '<header class="lg-top">\n <a class="lg-brand" href="%s" aria-label="KORE Trust Center"><img class="lg-logo" src="%sassets/kore-logo.png" alt="KORE">'
            '<i class="lg-div" aria-hidden="true"></i><span class="lg-name">Trust Center</span></a>\n%s</header>\n'
            ) % (title, ('<meta name="description" content="%s">\n' % desc) if desc else '', r, r, r or './', r,
                 (' <a class="lg-home" href="%s">&larr; Trust Center</a>\n' % r) if r else '')


def versionize(text):
    """Ogni link interno a un documento punta all'indirizzo con la versione (es. data-processing-agreement/v1-0/),
    non all'indirizzo generico: e' l'indirizzo che si cita nei contratti."""
    for d in DOCS:
        text = re.sub(r'href="((?:\.\./)*)%s/(#[^"]*)?"' % re.escape(d['slug']),
                      lambda m, d=d: 'href="%s%s/%s/%s"' % (m.group(1), d['slug'], vkey(current(d)), m.group(2) or ''), text)
    return text


def write(rel, text):
    text = versionize(text)
    path = os.path.join(OUT, rel, 'index.html') if rel else os.path.join(OUT, 'index.html')
    os.makedirs(os.path.dirname(path), exist_ok=True)
    open(path, 'w', encoding='utf-8', newline='\n').write(text)


def doc_page(doc, v, is_current_url):
    r = '../' if is_current_url else '../../'
    body, _ = sections(doc, v)
    cur = current(doc)
    perm = SITE + doc['slug'] + '/' + vkey(v) + '/'
    if v is cur:
        notice = ('Questa è la versione corrente. Indirizzo permanente di questa versione: '
                  '<a href="%s%s/%s/">%s</a>') % (r, doc['slug'], vkey(v), perm)
    else:
        notice = ('Questa versione non è più quella corrente. '
                  '<a href="%s%s/">Vai alla versione corrente (v%s)</a>') % (r, doc['slug'], cur['v'])
    return (head('KORE — %s v%s' % (doc['title'], v['v']), r)
            + '\n<main class="tc-wrap tc-doc">\n <div class="tc-inner">\n  <div class="dh">\n'
            + '   <h1 class="dh-title">KORE - %s</h1>\n' % doc['title']
            + '   <p class="dh-sub">%s</p>\n' % doc['sub']
            + '   <dl class="dh-meta-grid">%s</dl>\n' % ''.join('<div><dt>%s</dt><dd>%s</dd></div>' % kv for kv in (
                ('Versione', v['v']), ('Pubblicazione', date(v['pub'])), ('Stato', badge(v))))
            + '   <i class="dh-bar" aria-hidden="true"></i>\n'
            + '   <div class="dh-actions">\n'
            + '    <a class="dh-btn" href="%sassets/pdf/%s" download>%sScarica PDF</a>\n' % (r, pdf_name(doc, v), ICON['down'])
            + '    <button class="dh-btn" type="button" id="dh-hist-btn" aria-haspopup="dialog">%sVersioni precedenti</button>\n' % ICON['clock']
            + '   </div>\n  </div>\n'
            + history_dialog(doc, v, r)
            + layout('  <p class="dh-notice%s">%s</p>\n\n' % ('' if v is cur else ' is-old', notice)
                     + body.replace('{{root}}', r))
            + '\n  ' + FOOT.format(r=r) + '\n </div>\n</main>\n' + HIST_JS + TOC_JS + '</body>\n</html>\n')


TOC_RE = re.compile(r'<section class="tc-sec[^"]*" id="([^"]+)"><h2><i>([^<]*)</i>(.*?)</h2>')


def layout(content):
    """Indice a sinistra (titoli principali, cliccabili) + testo a destra."""
    items = []
    for sid, num, title in TOC_RE.findall(content):
        num = '' if num in ('&middot;', '\u00b7') else num
        items.append('<li><a href="#%s"><i>%s</i><span>%s</span></a></li>' % (sid, num, title))
    if len(items) < 2:
        return '<div class="tc-layout is-single"><div class="tc-body">\n' + content + '</div></div>\n'
    return ('<div class="tc-layout">\n <nav class="tc-toc" aria-label="Indice del documento"><details open>'
            '<summary>Indice del documento</summary><p class="tc-toc-h">Indice del documento</p><ol>%s</ol></details></nav>\n'
            ' <div class="tc-body">\n%s </div>\n</div>\n') % (''.join(items), content)


TOC_JS = ('<script>(function(){var t=document.querySelector(".tc-toc");if(!t)return;'
          'var d=t.querySelector("details"),mq=matchMedia("(max-width:1000px)");'
          'function fit(){if(mq.matches)d.removeAttribute("open");else d.setAttribute("open","")}fit();'
          'if(mq.addEventListener)mq.addEventListener("change",fit);else mq.addListener(fit);'
          'var L=[].slice.call(t.querySelectorAll("a")),S=L.map(function(a){return document.getElementById(a.hash.slice(1))});'
          't.addEventListener("click",function(e){if(e.target.closest("a")&&mq.matches)d.removeAttribute("open")});'
          'function on(){var y=innerHeight*0.3,k=0;S.forEach(function(s,i){if(s&&s.getBoundingClientRect().top<=y)k=i});'
          'L.forEach(function(a,i){a.classList.toggle("is-on",i===k)});'
          'var a=L[k],o=t.querySelector("ol");if(a&&o&&!mq.matches){var r=a.getBoundingClientRect(),n=o.getBoundingClientRect();'
          'if(r.top<n.top)o.scrollTop-=n.top-r.top+8;else if(r.bottom>n.bottom)o.scrollTop+=r.bottom-n.bottom+8}}'
          'addEventListener("scroll",on,{passive:true});on()})();</script>\n')


def history_dialog(doc, shown, r):
    """Finestra 'Versioni precedenti': solo le versioni di QUESTO documento, dalla piu' recente."""
    items = []
    for v in doc['versions']:
        here = v is shown
        tags = badge(v) + (' <span class="dh-here">Stai consultando questa versione</span>' if here else '')
        links = (('<a class="dh-link" href="%s%s/%s/">Apri la versione</a>' % (r, doc['slug'], vkey(v))) if not here else '') + \
                '<a class="dh-link" href="%sassets/pdf/%s" download>Scarica il PDF</a>' % (r, pdf_name(doc, v))
        items.append('    <li class="dh-item%s"><div class="dh-row"><b>Versione %s</b>%s</div>'
                     '<p class="dh-meta">Pubblicazione: %s</p><p class="dh-links">%s</p></li>\n'
                     % (' is-cur' if here else '', v['v'], tags, date(v['pub']), links))
    empty = ('   <p class="dh-empty">Non ci sono versioni precedenti: questa è la prima versione del documento. '
             'Quando verrà pubblicata una nuova versione, quelle precedenti resteranno sempre consultabili qui.</p>\n'
             if len(doc['versions']) == 1 else '')
    return ('  <dialog class="dh-dialog" id="dh-hist" aria-labelledby="dh-hist-t">\n'
            '   <div class="dh-dhead"><div><h2 id="dh-hist-t">Versioni precedenti</h2><p class="dh-dsub">%s</p></div>'
            '<button type="button" class="dh-x" id="dh-hist-x" aria-label="Chiudi">&times;</button></div>\n'
            '   <ol class="dh-list">\n%s   </ol>\n%s  </dialog>\n') % (doc['title'], ''.join(items), empty)


HIST_JS = ('<script>(function(){var d=document.getElementById("dh-hist"),b=document.getElementById("dh-hist-btn"),'
           'x=document.getElementById("dh-hist-x");if(!d||!b)return;'
           'function open(){if(d.showModal)d.showModal();else d.setAttribute("open","")}'
           'function close(){if(d.close)d.close();else d.removeAttribute("open");b.focus()}'
           'b.addEventListener("click",open);x.addEventListener("click",close);'
           'd.addEventListener("click",function(e){if(e.target===d)close()});'
           'if(location.hash==="#versioni")open()})();</script>\n')


def simple_page(p):
    r = '../'
    if p['src']:
        body = open(os.path.join(HERE, 'content', 'pages', p['src']), encoding='utf-8').read().replace('{{root}}', r)
    else:  # registro delle modifiche: elenco di tutte le versioni
        rows = []
        for d in DOCS:
            for v in d['versions']:
                rows.append('<tr><td data-label="Documento">%s</td><td data-label="Versione"><a href="%s%s/%s/">v%s</a></td>'
                            '<td data-label="Pubblicazione">%s</td><td data-label="Stato">%s</td></tr>'
                            % (d['title'], r, d['slug'], vkey(v), v['v'], date(v['pub']), badge(v)))
        body = ('  <div class="tc-note">Qui verrà descritto, per ogni nuova versione, cosa è cambiato rispetto alla precedente. '
                'Per ora è disponibile l’elenco delle versioni pubblicate.</div>\n'
                '  <section class="tc-sec"><h2><i>01</i>Versioni pubblicate</h2><i class="tc-rule" aria-hidden="true"></i>\n'
                '   <div class="tc-tabwrap"><table class="tc-table"><thead><tr><th>Documento</th><th>Versione</th><th>Pubblicazione</th>'
                '<th>Stato</th></tr></thead><tbody>%s</tbody></table></div>\n  </section>\n') % ''.join(rows)
    return (head('KORE — ' + p['title'], r)
            + '\n<main class="tc-wrap tc-doc">\n <div class="tc-inner">\n  <div class="dh">\n'
            + '   <h1 class="dh-title">%s</h1>\n   <p class="dh-sub">%s</p>\n' % (p['title'], p['sub'])
            + '   <i class="dh-bar" aria-hidden="true"></i>\n  </div>\n\n'
            + layout(body) + '\n  ' + FOOT.format(r=r) + '\n </div>\n</main>\n' + TOC_JS + '</body>\n</html>\n')


def card(d):
    v = current(d)
    _, titles = sections(d, v)
    return ('     <a class="tr-card" href="%s/">\n'
            '      <div class="tr-ct"><h3>%s</h3>%s</div>\n'
            '      <div class="tr-meta">%s<span>v%s &middot; %s</span></div>\n'
            '      <ul>%s</ul>\n'
            '      <span class="tr-more"><span>Vedi tutte le %d sezioni</span>%s</span>\n     </a>\n'
            ) % (d['slug'], d['title'], ICON['right'], badge(v), v['v'], date(v['eff'] or v['pub']),
                 ''.join('<li>%s</li>' % t for t in titles[:3]), len(titles), ICON['arrow'])


# loghi ufficiali dei sub-responsabili (file in trust/assets/logos/, nessuna risorsa esterna)
SP_LOGOS = [('Amazon Web Services', 'aws.svg'), ('Gupshup', 'gupshup.svg'), ('Aruba', 'aruba.svg')]


def sp_name(name):
    for prefix, f in SP_LOGOS:
        if name.startswith(prefix):
            return '<span class="tr-sp"><img src="assets/logos/%s" alt="" loading="lazy"><span>%s</span></span>' % (f, name)
    return '<span class="tr-sp"><span>%s</span></span>' % name


def home():
    groups = []
    for g in ('Contrattuali', 'Piattaforma', 'Privacy'):
        groups.append('    <section class="tr-group"><h3 class="tr-gh">%s</h3>\n    <div class="tr-docs">\n%s    </div></section>\n'
                      % (g, ''.join(card(d) for d in DOCS if d['group'] == g)))
    comp = ''.join('      <div class="tr-badge"><span class="tr-seal%s">%s</span><div><b>%s</b>%s<small>%s</small></div></div>\n'
                   % (' is-img' if t in SEAL_IMG else (' is-soon' if tag else (' is-ic' if t in SEAL_ICON else '')),
                      ('<img src="assets/logos/%s" alt="">' % SEAL_IMG[t]) if t in SEAL_IMG else (ICON[SEAL_ICON[t]] if t in SEAL_ICON else seal),
                      t, (' <span class="tr-tag">%s</span>' % tag) if tag else '', desc)
                   for seal, t, desc, tag in COMPLIANCE)
    pdfs = ''.join('       <li><a href="assets/pdf/%s" download><i class="tr-pdf-ic">%s</i><span>%s<small>v%s &middot; %s &middot; %s</small></span>%s</a></li>\n'
                   % (pdf_name(d, current(d)), ICON['pdf'], d['title'], current(d)['v'], STATUS[current(d)['status']][0],
                      date(current(d)['eff'] or current(d)['pub']), ICON['down']) for d in DOCS)
    sp = SUBPROCESSORS
    sub_rows = ''.join('<tr>%s</tr>' % ''.join('<td data-label="%s">%s</td>' % (h, c) for h, c in zip(
        ('Soggetto', 'Servizio', 'Ruolo privacy', 'Paese/regione', 'Garanzia trasferimento'), (sp_name(row[0]),) + tuple(row[1:]))) for row in sp['rows'])
    others = ''.join('<tr>%s</tr>' % ''.join('<td data-label="%s">%s</td>' % (h, c) for h, c in zip(
        ('Soggetto', 'Attività', 'Ruolo privacy'), row)) for row in sp['others'])
    if sp['planned']:
        planned = ('    <div class="tc-tabwrap"><table class="tc-table"><thead><tr><th>Nuovo sub-responsabile</th><th>Servizio</th>'
                   '<th>Data di inizio</th></tr></thead><tbody>%s</tbody></table></div>\n') % ''.join(
            '<tr>%s</tr>' % ''.join('<td data-label="%s">%s</td>' % (h, c) for h, c in zip(
                ('Nuovo sub-responsabile', 'Servizio', 'Data di inizio'), row)) for row in sp['planned'])
    else:
        planned = '    <p class="tr-none">Nessuna modifica pianificata.</p>\n'
    sec = ''.join('     <article class="tr-sec-card"><h3>%s</h3><p>%s</p></article>\n' % (t, x.replace('{{root}}', ''))
                  for t, x in SECURITY)
    arch = ''
    for d in DOCS:
        rows = ''.join('<tr><td data-label="Versione"><a href="%s/%s/">v%s</a></td><td data-label="Data pubblicazione">%s</td>'
                       '<td data-label="Stato">%s</td>'
                       '<td data-label="PDF"><a href="assets/pdf/%s" download>Scarica</a></td></tr>'
                       % (d['slug'], vkey(v), v['v'], date(v['pub']), badge(v), pdf_name(d, v)) for v in d['versions'])
        arch += ('    <section class="tr-arch" id="archivio-%s"><h3 class="tr-gh"><a href="%s/">%s</a></h3>\n'
                 '     <div class="tc-tabwrap"><table class="tc-table"><thead><tr><th>Versione</th><th>Data pubblicazione</th>'
                 '<th>Stato</th><th>PDF</th></tr></thead><tbody>%s</tbody></table></div>\n    </section>\n'
                 ) % (d['slug'], d['slug'], d['title'], rows)

    return (head('KORE Trust Center', '', 'Documenti contrattuali, privacy e sicurezza della piattaforma KORE di One Tech S.r.l.')
     + '''
<section class="tr-hero">
 <div class="tr-hero-in">
  <h1><b>KORE</b> Trust Center</h1>
  <p>KORE è la piattaforma di One Tech S.r.l. per la gestione dei lead nel credito. Qui trovi in un unico posto i documenti contrattuali e privacy, i sub-responsabili, le misure di sicurezza e l’archivio di tutte le versioni.</p>
  <div class="tr-links">
   <a href="mailto:support@otech.one">%(mail)s<span><small>Supporto</small><em class="tr-mail">support@otech.one</em></span></a>
   <a href="mailto:sales@otech.one">%(mail)s<span><small>Richieste commerciali</small><em class="tr-mail">sales@otech.one</em></span></a>
  </div>
 </div>
</section>

<main class="tr-main" id="tr-main">
 <div class="tr-in">
  <div class="tr-tabs" role="tablist" aria-label="Sezioni del Trust Center">
   <button class="tr-tab" role="tab" type="button" data-view="panoramica">Panoramica</button>
   <button class="tr-tab" role="tab" type="button" data-view="documenti">Documenti</button>
   <button class="tr-tab" role="tab" type="button" data-view="sub-responsabili">Sub-responsabili</button>
   <button class="tr-tab" role="tab" type="button" data-view="sicurezza">Sicurezza</button>
   <button class="tr-tab" role="tab" type="button" data-view="archivio">Archivio versioni</button>
  </div>

  <div class="tr-panel" data-panel="panoramica">
   <div class="tr-grid">
    <div class="tr-side">
     <section>
      <div class="tr-h"><h2>Conformità</h2></div>
      <div class="tr-box">
%(comp)s      </div>
     </section>
     <section>
      <div class="tr-h"><h2>Risorse</h2></div>
      <div class="tr-box">
       <ul class="tr-res">
        <li><a href="#sub-responsabili" data-go="sub-responsabili">%(doc)s<span>Elenco Sub-responsabili</span>%(right)s</a></li>
        <li><a href="#sicurezza" data-go="sicurezza">%(doc)s<span>Misure di sicurezza</span>%(right)s</a></li>
        <li><a href="uso-ai/">%(doc)s<span>Uso dell’AI in KORE</span>%(right)s</a></li>
        <li><a href="registro-modifiche/">%(doc)s<span>Registro delle modifiche</span>%(right)s</a></li>
       </ul>
       <p class="tr-res-h">PDF dei documenti</p>
       <ul class="tr-res is-pdf">
%(pdfs)s       </ul>
      </div>
     </section>
    </div>
    <section class="tr-docwrap">
     <div class="tr-h"><h2>Documenti</h2><a href="#documenti" class="tr-all" data-go="documenti"><span>Vedi tutti</span>%(arrow)s</a></div>
     <div class="tr-docs">
%(cards)s     </div>
    </section>
   </div>
  </div>

  <div class="tr-panel" data-panel="documenti" hidden>
%(groups)s  </div>

  <div class="tr-panel" data-panel="sub-responsabili" hidden>
   <p class="tr-upd">Ultimo aggiornamento: <b>%(upd)s</b></p>
   <p class="tr-intro">Fornitori a cui One Tech S.r.l. affida parte dei trattamenti svolti per conto dei clienti, ai sensi dell’art. 7 e dell’<a href="data-processing-agreement/#allegato-c">Allegato C</a> del Data Processing Agreement.</p>
   <div class="tc-tabwrap"><table class="tc-table"><thead><tr><th>Soggetto</th><th>Servizio</th><th>Ruolo privacy</th><th>Paese/regione</th><th>Garanzia trasferimento</th></tr></thead><tbody>%(subrows)s</tbody></table></div>
   <section class="tr-block">
    <h3 class="tr-gh">Altri soggetti della filiera che non sono Sub-responsabili</h3>
    <div class="tc-tabwrap"><table class="tc-table"><thead><tr><th>Soggetto</th><th>Attività</th><th>Ruolo privacy</th></tr></thead><tbody>%(others)s</tbody></table></div>
   </section>
  </div>

  <div class="tr-panel" data-panel="sicurezza" hidden>
   <p class="tr-intro">Le misure tecniche e organizzative adottate da One Tech S.r.l. per proteggere la piattaforma KORE e i dati dei clienti. La descrizione contrattualmente vincolante è nell’<a href="data-processing-agreement/#allegato-b">Allegato B del Data Processing Agreement</a>.</p>
   <div class="tr-sec-grid">
%(sec)s   </div>
  </div>

  <div class="tr-panel" data-panel="archivio" hidden>
   <p class="tr-intro">Ogni versione di ogni documento resta sempre consultabile al suo indirizzo permanente: i contratti rimandano a una versione specifica, quindi le versioni precedenti non vengono mai eliminate.</p>
%(arch)s  </div>

  %(foot)s
 </div>
</main>
<script>
/* Schede del Trust Center (anche da indirizzo: #documenti, #sub-responsabili, #sicurezza, #archivio, #archivio-<documento>) */
(function(){
 var tabs=[].slice.call(document.querySelectorAll('.tr-tab')),panels=[].slice.call(document.querySelectorAll('.tr-panel')),views=tabs.map(function(t){return t.getAttribute('data-view')});
 function show(hash,push){
  var v=hash,target=null;
  if(/^archivio-/.test(hash)){v='archivio';target=document.getElementById(hash)}
  if(views.indexOf(v)<0)v='panoramica';
  tabs.forEach(function(t){t.setAttribute('aria-selected',String(t.getAttribute('data-view')===v))});
  panels.forEach(function(p){p.hidden=p.getAttribute('data-panel')!==v});
  if(push)history.replaceState(null,'',v==='panoramica'?location.pathname:'#'+hash);
  if(target)setTimeout(function(){target.scrollIntoView({block:'start'})},0);
 }
 tabs.forEach(function(t){t.addEventListener('click',function(){show(t.getAttribute('data-view'),true)})});
 [].forEach.call(document.querySelectorAll('[data-go]'),function(b){b.addEventListener('click',function(e){e.preventDefault();show(b.getAttribute('data-go'),true);document.getElementById('tr-main').scrollIntoView({behavior:'smooth',block:'start'})})});
 show(location.hash.slice(1),false);
 window.addEventListener('hashchange',function(){show(location.hash.slice(1),false)});
})();
</script>
</body>
</html>
''' % dict(mail=ICON['mail'], right=ICON['right'], doc=ICON['doc'], arrow=ICON['arrow'], comp=comp, pdfs=pdfs, cards=''.join(card(d) for d in DOCS),
           groups=''.join(groups), upd=date(sp['updated']), subrows=sub_rows, others=others, planned=planned, sec=sec, arch=arch,
           foot=FOOT.format(r='')))


def make_pdfs():
    os.makedirs(os.path.join(OUT, 'assets', 'pdf'), exist_ok=True)
    for d in DOCS:
        for v in d['versions']:
            out = os.path.join(OUT, 'assets', 'pdf', pdf_name(d, v))
            if v.get('pdf_src'):  # PDF ufficiale fornito: si copia cosi' com'e', non si genera
                shutil.copyfile(os.path.join(HERE, v['pdf_src']), out)
                print('pdf', pdf_name(d, v), '(copiato)')
                continue
            if os.path.exists(out) and v['status'] != 'bozza':
                continue  # versione pubblicata: il suo PDF non si tocca
            subprocess.run([EDGE, '--headless=new', '--disable-gpu', '--no-pdf-header-footer', '--virtual-time-budget=3000',
                            '--print-to-pdf=' + out, LOCAL + d['slug'] + '/' + vkey(v) + '/'],
                           check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            print('pdf', pdf_name(d, v), os.path.getsize(out))


if __name__ == '__main__':
    for d in DOCS:
        for v in d['versions']:
            write(d['slug'] + '/' + vkey(v), doc_page(d, v, False))
        write(d['slug'], doc_page(d, current(d), True))
    for p in PAGES:
        write(p['slug'], simple_page(p))
    write('', home())
    print('pagine generate in', OUT)
    if '--no-pdf' not in sys.argv:
        make_pdfs()
