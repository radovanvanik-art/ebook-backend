'use strict';
/**
 * Server-side lokalizácia statických HTML stránok pre jazykové URL (/en, /ua, /de).
 *
 * Každá stránka má inline <script> blok s `const TRANSLATIONS = {...}` (sk/en/ua/de)
 * a elementy s `data-i18n="kluc"`. Klientský JS (setLang) robí presne tento istý
 * swap v prehliadači pri kliknutí na prepínač jazykov. Tento modul robí to isté
 * na serveri, aby crawler (a prvá návšteva bez JS) videl reálny preložený obsah
 * priamo v HTML, nie až po vykonaní JS.
 */

const cheerio = require('cheerio');

// Interný URL segment -> skutočný jazykový kód (hreflang / <html lang>).
// "ua" sa historicky používa ako interný kľúč/URL segment (flag = Ukrajina),
// ale správny ISO 639-1 kód pre ukrajinčinu v hreflang je "uk".
const LANG_SEGMENTS = {
  en: { htmlLang: 'en', hreflang: 'en' },
  ua: { htmlLang: 'uk', hreflang: 'uk' },
  de: { htmlLang: 'de', hreflang: 'de' }
};

const SITE_ORIGIN = 'https://www.radovanvanik.com';

function extractTranslations(html) {
  const marker = 'const TRANSLATIONS = {';
  const startIdx = html.indexOf(marker);
  if (startIdx === -1) return null;

  const rest = html.slice(startIdx);
  const lines = rest.split('\n');
  const objLines = [];
  let found = false;
  for (const line of lines) {
    objLines.push(line);
    if (line.trim() === '};') {
      found = true;
      break;
    }
  }
  if (!found) return null;

  const src = objLines.join('\n').replace(/^const TRANSLATIONS = /, '');
  try {
    // eslint-disable-next-line no-new-func
    const build = new Function('return (' + src.replace(/;\s*$/, '') + ')');
    return build();
  } catch (err) {
    console.error('[i18n-render] TRANSLATIONS parse failed:', err.message);
    return null;
  }
}

/**
 * Pridá <link rel="alternate" hreflang="..."> + canonical do <head>, pre VŠETKY
 * jazykové varianty danej stránky (vrátane default sk verzie bez prefixu).
 * urlLangSegment = null pre sk (default, bez prefixu), inak 'en' | 'ua' | 'de'.
 */
function injectHreflang($, canonicalPath, urlLangSegment) {
  $('head link[rel="alternate"][hreflang]').remove();
  $('head link[rel="canonical"]').remove();

  const path = canonicalPath === '/' ? '/' : canonicalPath;
  const variants = [
    { hreflang: 'sk', href: SITE_ORIGIN + path },
    { hreflang: 'en', href: SITE_ORIGIN + '/en' + (path === '/' ? '' : path) },
    { hreflang: 'uk', href: SITE_ORIGIN + '/ua' + (path === '/' ? '' : path) },
    { hreflang: 'de', href: SITE_ORIGIN + '/de' + (path === '/' ? '' : path) },
    { hreflang: 'x-default', href: SITE_ORIGIN + path }
  ];

  let tags = '';
  variants.forEach(v => {
    tags += `<link rel="alternate" hreflang="${v.hreflang}" href="${v.href}" />\n`;
  });

  const canonicalHref = urlLangSegment
    ? SITE_ORIGIN + '/' + urlLangSegment + (path === '/' ? '' : path)
    : SITE_ORIGIN + path;
  tags += `<link rel="canonical" href="${canonicalHref}" />\n`;

  $('head').append(tags);
}

/** Prepíše interné relatívne/absolútne linky tak, aby si držali jazykový prefix. */
function rewriteInternalLinks($, urlLangSegment) {
  const prefix = '/' + urlLangSegment;
  $('a[href]').each((_, el) => {
    const $el = $(el);
    const href = $el.attr('href');
    if (!href) return;
    if (/^(https?:|mailto:|tel:|whatsapp:|#|javascript:)/i.test(href)) return;
    if (href.startsWith(prefix + '/') || href === prefix) return;
    if (href === '/') {
      $el.attr('href', prefix + '/');
    } else if (href.startsWith('/')) {
      $el.attr('href', prefix + href);
    }
  });
}

/**
 * @param {string} html   Pôvodný (slovenský) HTML obsah stránky.
 * @param {string} canonicalPath   Napr. '/' alebo '/kalkulacka' (bez jazykového prefixu).
 * @param {string|null} urlLangSegment  'en' | 'ua' | 'de' pre lokalizovanú verziu, null pre sk.
 * @returns {string} výsledné HTML
 */
function renderLocalized(html, canonicalPath, urlLangSegment) {
  // BOM na začiatku súboru mýli parse5/cheerio (reparentuje celý <head> do <body>) —
  // prehliadače ho ticho ignorujú, ale server-side parser nie, tak ho tu odstránime.
  const clean = html.charCodeAt(0) === 0xFEFF ? html.slice(1) : html;
  const $ = cheerio.load(clean, { decodeEntities: false });

  if (urlLangSegment) {
    const meta = LANG_SEGMENTS[urlLangSegment];
    if (!meta) return html;

    const translations = extractTranslations(html);
    const dict = translations && translations[urlLangSegment];
    if (dict) {
      $('[data-i18n]').each((_, el) => {
        const key = $(el).attr('data-i18n');
        if (dict[key] != null) $(el).html(dict[key]);
      });
      // placeholder na CTA email inpute (blogy.html)
      const emailInput = $('#ctaEmailInput');
      if (emailInput.length && dict['email_placeholder']) {
        emailInput.attr('placeholder', dict['email_placeholder']);
      }
    }

    $('html').attr('lang', meta.htmlLang);
    rewriteInternalLinks($, urlLangSegment);
  }

  injectHreflang($, canonicalPath, urlLangSegment);

  return $.html();
}

module.exports = { renderLocalized, extractTranslations, LANG_SEGMENTS };
