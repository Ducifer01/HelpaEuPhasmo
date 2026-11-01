/*
 * Peças comuns do Dashboard e dos HUDs: utilitários, ícones e a "ponte" com o processo principal.
 * Aberto direto no navegador (sem Electron), usa uma ponte local para dar para testar a interface.
 */
(function (root) {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const CURTO = { emf: 'EMF 5', orb: 'Orbe', box: 'Spirit Box', freezing: 'Congelante', uv: 'Ultravioleta', writing: 'Escrita', dots: 'D.O.T.S.' };
  const MINI = { emf: 'EMF', box: 'Box', uv: 'UV', orb: 'Orbe', writing: 'Livro', freezing: 'Frio', dots: 'DOTS' };
  const svg = (d) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
  const ICONES = {
    hud: svg('<rect x="3" y="4" width="18" height="16" rx="2"/><rect x="13" y="7" width="5" height="10" rx="1"/>'),
    atraves: svg('<path d="M5 3l12 7-5 1.5L9.5 17z"/><path d="M14 14l5 5"/>'),
    min: svg('<path d="M5 12h14"/>'),
    x: svg('<path d="M6 6l12 12M18 6L6 18"/>'),
    lupa: svg('<circle cx="11" cy="11" r="6"/><path d="M20 20l-4.5-4.5"/>'),
    cadeado: svg('<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>'),
    aberto: svg('<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 7.5-2"/>'),
    painel: svg('<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M9 9v11"/>')
  };
  const atalhoTexto = (a) => (a ? a.replace(/Control/g, 'Ctrl').replace(/\+/g, ' + ') : '—');

  /** Botões dos "sinais únicos" (contrato sem evidência). */
  function sinaisHtml(estado, mini) {
    const CAR = root.CARACTERISTICAS;
    return root.Estado.SINAIS.map((s, i) => {
      const st = s.ev ? estado.evid.orb : estado.marc[s.id];
      const desc = CAR.find((m) => m.id === s.id);
      const tit = esc((s.dica || (desc ? desc.nome : '')) + ' → ' + s.g);
      if (mini) return `<button class="hfe ${st || ''}" data-sinal="${s.id}" title="${tit}">${esc(s.curto)}</button>`;
      return `<button class="ev ${st || ''}" data-sinal="${s.id}" title="${tit}"><span class="n">${esc(s.curto)}</span><span class="s">${st === 'sim' ? 'é ' + esc(s.g) : st === 'nao' ? 'não é ' + esc(s.g) : esc(s.g)}</span><kbd>${(i + 1) % 10}</kbd></button>`;
    }).join('');
  }

  /** Ponte local (navegador): mesmo contrato do preload, com o estado em memória/localStorage. */
  function ponteLocal() {
    const E = root.Estado;
    const ouvintes = {};
    const emitir = (c, d) => (ouvintes[c] || []).forEach((f) => f(d));
    let estado = E.normalizar(JSON.parse(localStorage.getItem('hep-estado') || 'null'));
    const config = {
      modo: 'dash', atraves: false, versao: 'navegador', ui: { opacidade: 0.94, zoom: 1 },
      atalhos: { alternarVisivel: 'Control+Alt+H', travar: 'F10', alternarModo: 'Control+Alt+D', novoContrato: 'Control+Alt+N', incenso: 'F6', cacada: 'F7', passo: 'F8', contrato: 'F9', zerar: 'Control+Alt+0', evidencias: 'Alt' },
      huds: {
        t: { vis: true, trav: false, op: 0.78, sz: 1, itens: { incenso: true, cacada: true, contrato: true, passos: true } },
        f: { vis: true, trav: false, op: 0.78, sz: 1, itens: { evid: true, lista: true, sug: true } }
      }
    };
    config.atalhosPadrao = Object.assign({}, config.atalhos);
    const acao = (a) => {
      const r = E.aplicar(estado, a, Date.now()); estado = r.estado;
      localStorage.setItem('hep-estado', JSON.stringify(estado));
      emitir('estado', estado); if (r.aviso) emitir('aviso', r.aviso);
    };
    // Atalhos de teclado do app (no navegador não existem atalhos globais).
    document.addEventListener('keydown', (e) => {
      const m = { F6: { tipo: 'timer', id: 'incenso' }, F7: { tipo: 'cacada' }, F8: { tipo: 'toque' }, F9: { tipo: 'timer', id: 'contrato' } }[e.key];
      if (m) { e.preventDefault(); acao(m); }
      if (e.key === 'F10') { e.preventDefault(); config.atraves = !config.atraves; emitir('config', config); }
    });
    return {
      disponivel: false,
      on: (c, f) => { (ouvintes[c] = ouvintes[c] || []).push(f); },
      iniciar: async () => ({ config, estado }),
      acao,
      modo: (m) => { config.modo = m; emitir('config', config); },
      atraves: (v) => { config.atraves = typeof v === 'boolean' ? v : !config.atraves; emitir('config', config); },
      hudConfig: (k, patch) => { if (patch.itens) patch.itens = Object.assign({}, config.huds[k].itens, patch.itens); Object.assign(config.huds[k], patch); emitir('config', config); },
      hudTamanho: () => {}, capturarMouse: () => {},
      salvarUi: (ui) => { Object.assign(config.ui, ui); emitir('config', config); },
      definirAtalhos: async (at) => { Object.assign(config.atalhos, at); emitir('config', config); return { falhas: [], atalhos: config.atalhos }; },
      pausarAtalhos: async () => true,
      ocultar: () => {}, minimizar: () => {}, fechar: () => {}
    };
  }

  root.UI = { $, $$, esc, CURTO, MINI, ICONES, atalhoTexto, sinaisHtml, ponte: () => root.overlay || ponteLocal() };
})(window);
