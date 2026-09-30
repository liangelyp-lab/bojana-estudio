// ============================================
// Bojana Estudio — Language toggle (ES / EN)
// ============================================

const translations = {
  es: {
    discipline: "Arquitectura &amp; Ingeniería Civil",
    headline:   "Próximamente",
    body:       "Estamos construyendo algo con la misma dedicación<br class=\"br-desktop\"/> que ponemos en cada proyecto.",
    scope:      "Trabajo remoto global &nbsp;·&nbsp; Presencial en Argentina",
    footer:     "© 2026 Bojana Estudio",
    langLabel:  "EN",
  },
  en: {
    discipline: "Architecture &amp; Civil Engineering",
    headline:   "Coming Soon",
    body:       "We're building something with the same dedication<br class=\"br-desktop\"/> we bring to every project.",
    scope:      "Remote worldwide &nbsp;·&nbsp; On-site in Argentina",
    footer:     "© 2026 Bojana Estudio",
    langLabel:  "ES",
  }
};

let currentLang = "es";

function toggleLang() {
  currentLang = currentLang === "es" ? "en" : "es";
  applyLang(currentLang);
}

function applyLang(lang) {
  const t = translations[lang];
  const $ = (id) => document.getElementById(id);

  $("txt-discipline").innerHTML = t.discipline;
  $("txt-headline").textContent  = t.headline;
  $("txt-body").innerHTML        = t.body;
  $("txt-scope").innerHTML       = t.scope;
  $("txt-footer").textContent    = t.footer;
  $("lang-label").textContent    = t.langLabel;

  document.documentElement.lang = lang;
}

// Detect browser language on load
window.addEventListener("DOMContentLoaded", () => {
  const browserLang = navigator.language?.slice(0, 2).toLowerCase();
  if (browserLang === "en") {
    currentLang = "en";
    applyLang("en");
  }
});
