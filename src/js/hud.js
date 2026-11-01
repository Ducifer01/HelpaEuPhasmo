/*
 * HUD no jogo (uma janela por HUD): ?k=t → Cronômetros, ?k=f → Fantasmas.
 * Destravado: barra de cima para arrastar, fundo e tamanho, travar e ocultar.
 * Travado: o mouse passa para o jogo; só o cadeado no canto pega o mouse para destravar.
 */
(function () {
  'use strict';
  const { $, esc, CURTO, MINI, ICONES, atalhoTexto, sinaisHtml } = UI;
  const ov = UI.ponte();
  const K = new URLSearchParams(location.search).get('k') === 'f' ? 'f' : 't';
  const LARGURA = K === 't' ? 300 : 310;
  const TITULO = K === 't' ? 'Cronômetros' : 'Fantasmas';
  document.title = 'HelpaEuPhasmo · ' + TITULO;

  let S = null; let C = null; let R = {}; let aviso = null; let avisoT = null; let assinaturaTopo = '';
  const H = () => C.huds[K];

  function renderTopo() {
    const h = H();
    const ass = `${h.trav}|${C.atalhos.travar}`;
    if (ass === assinaturaTopo) return;
    assinaturaTopo = ass;
    const topo = $('#topo');
    topo.className = h.trav ? '' : 'hud-topo';
    topo.style.display = h.trav ? 'none' : '';
    topo.innerHTML = h.trav ? '' : `<div class="hud-cab"><span class="arr" aria-hidden="true">⠿</span><span class="tit">${TITULO}</span>
        ${K === 't' ? '<button class="link" data-a="zerar">zerar</button>' : ''}<span class="esp"></span>
        <button class="ic mini" data-a="dash" title="Abrir o Dashboard">${ICONES.painel}</button>
        <button class="ic mini" data-a="travar" title="Travar este HUD (${esc(atalhoTexto(C.atalhos.travar))} trava todos)">${ICONES.aberto}</button>
        <button class="ic mini x" data-a="ocultar" title="Ocultar este HUD (volte em Ajustes ou na bandeja)">${ICONES.x}</button></div>
      <div class="hud-cfg"><label>Fundo <input type="range" min="0" max="1" step="0.05" value="${h.op}" data-cfg="op"></label><label>Tamanho <input type="range" min="0.8" max="1.4" step="0.1" value="${h.sz}" data-cfg="sz"></label></div>`;
  }

  function aplicarVisual() {
    const h = H();
    const hud = $('#hud');
    hud.className = 'hud ' + (h.trav ? 'trav' : 'livre');
    hud.style.setProperty('--hf', h.op);
    $('#caixa').style.width = LARGURA * h.sz + 'px';
    $('#corpo').style.zoom = h.sz;
    let tr = $('#caixa > .trava');
    if (h.trav && !tr) { tr = document.createElement('button'); tr.className = 'trava'; tr.dataset.a = 'destravar'; tr.title = 'Destravar este HUD'; tr.innerHTML = ICONES.cadeado; $('#caixa').appendChild(tr); }
    if (!h.trav && tr) tr.remove();
  }

  function renderCorpo() {
    if (!S || !C) return;
    R = Motor.avaliar(Estado.paraMotor(S));
    $('#corpo').innerHTML = K === 't' ? corpoTimers() : corpoFantasmas();
    tick();
  }

  function corpoTimers() {
    const it = H().itens; const at = C.atalhos;
    const linha = (id, nome, tecla) => `<button class="ht" data-tm="${id}" data-timer="${id}"><span class="hl"><span class="nm">${nome}</span><kbd>${esc(atalhoTexto(tecla))}</kbd></span><span class="v">0:00</span><span class="st"></span>${id === 'incenso' ? '<span class="prog"></span>' + [60, 90, 180].map((s) => `<span class="mk" style="left:${s / 2}%"></span>`).join('') : ''}</button>`;
    let c = '';
    if (it.incenso) c += linha('incenso', 'Incenso', at.incenso);
    if (it.cacada) c += linha('cacada', 'Caçada', at.cacada);
    if (it.contrato) c += linha('contrato', 'Contrato', at.contrato);
    if (it.passos) {
      c += `<button class="hp" data-a="toque" title="Aperte a cada passo que ouvir na caçada"><span class="hl"><span class="nm">Passos</span><kbd>${esc(atalhoTexto(at.passo))}</kbd><span class="dica">aperte a cada passo</span></span>
        <span class="hp-l"><span class="v" id="t-passos">—</span><small>m/s</small><span class="pd" id="t-passos-dots"></span></span><span class="st" id="t-passos-st"></span></button>`;
    }
    return c || '<div class="hud-vazio">Nenhum cronômetro ligado. Escolha em Ajustes → HUDs no jogo.</div>';
  }

  function corpoFantasmas() {
    const it = H().itens; const n = Estado.nEvid(S.contrato);
    const v = FANTASMAS.filter((g) => R[g.id].possivel);
    const achadas = Object.values(S.evid).filter((x) => x === 'sim').length;
    let c = `<div class="hf-top"><span>${esc(Estado.nomeDif(S.contrato))}${S.contrato.dif === 'semevid' ? '' : ` · ${n === 0 ? 'sem evid.' : `${achadas}/${n} evid.`}`}</span><span class="restam"><b>${v.length}</b>/30</span></div>`;
    if (it.evid && n === 0) c += `<div class="hf-ev sinais">${sinaisHtml(S, true)}</div>`;
    else if (it.evid) c += `<div class="hf-ev">${Estado.ORDEM_EV.map((id, i) => `<button class="hfe ${S.evid[id] || ''}" data-ev="${id}" title="${CURTO[id]} · ${esc(atalhoTexto(C.atalhos.evidencias))} + ${i + 1}">${MINI[id]}</button>`).join('')}</div>`;
    if (it.lista) {
      if (v.length === 1) c += `<div class="hf-unico">É <b>${esc(v[0].nome)}</b><small>caça ${esc(v[0].caca.curto || v[0].caca.texto)}</small></div>`;
      else if (!v.length) c += '<div class="hf-muitos" style="color:var(--ruim)">Nenhum combina. Revise a última marcação.</div>';
      else if (v.length > 12) c += `<div class="hf-muitos"><b>${v.length}</b> possíveis. Marque evidências ou comportamentos para filtrar.</div>`;
      else c += `<div class="hf-g">${v.slice().sort((a, b) => a.nome.localeCompare(b.nome)).map((g) => `<span class="hg"><span>${esc(g.nome)}</span><small>${esc((g.caca.curto || g.caca.texto).split(' ')[0])}</small></span>`).join('')}</div>`;
    }
    if (it.sug && v.length > 1) {
      const sug = Motor.sugerirTestes(Estado.paraMotor(S), R, 2);
      if (sug.length) c += `<div class="hf-sug"><span>Teste agora</span>${sug.map((s) => `<div>${esc(s.m.nome)}</div>`).join('')}</div>`;
    }
    if (aviso) c += `<div class="toast" role="status">${esc(aviso.texto)}${aviso.marcar && !H().trav ? '<div class="a"><button class="btn pri" data-a="toast-ok">Marcar</button></div>' : ''}</div>`;
    return c;
  }

  function tick() {
    if (!S || K !== 't') return;
    const st = Estado.statusTimers(S, Date.now());
    for (const id of ['incenso', 'cacada', 'contrato']) {
      const el = document.querySelector(`[data-timer="${id}"]`); if (!el) continue;
      const s = st[id];
      el.classList.toggle('rodando', s.rodando && !s.perigo); el.classList.toggle('perigo', !!s.perigo);
      $('.v', el).textContent = Estado.fmtTempo(s.ms);
      const x = $('.st', el); x.textContent = s.st; x.className = 'st ' + (s.cls || '');
      const p = $('.prog', el); if (p && s.prog != null) p.style.width = s.prog + '%';
    }
    const pv = $('#t-passos');
    if (pv) {
      pv.textContent = S.med ? S.med.v.toFixed(2).replace('.', ',') : '—';
      const ok = S.med ? Estado.fantasmasPelaVelocidade(S, R) : [];
      $('#t-passos-st').textContent = S.med ? `${Math.round(S.med.bpm)}/min · ${ok.length ? ok.slice(0, 3).join(', ') + (ok.length > 3 ? '…' : '') : 'nenhum sem visão'}` : 'toque no ritmo dos passos';
      const recentes = S.toques.length && Date.now() - S.toques[S.toques.length - 1] < 2500 ? S.toques.length : 0;
      $('#t-passos-dots').innerHTML = Array.from({ length: 8 }, (_, i) => `<i class="${i < recentes ? 'on' : ''}"></i>`).join('');
    }
  }

  // Tamanho da janela = tamanho do conteúdo
  let ultimoTam = '';
  function informarTamanho() {
    const r = $('#hud').getBoundingClientRect();
    const topo = H().trav ? 0 : $('#topo').getBoundingClientRect().height + 8;
    const ass = `${Math.ceil(r.width)}x${Math.ceil(r.height)}|${Math.round(topo)}`;
    if (ass === ultimoTam) return;
    ultimoTam = ass;
    ov.hudTamanho(r.width, r.height, topo);
  }
  new ResizeObserver(informarTamanho).observe($('#hud'));

  function render() { renderTopo(); aplicarVisual(); renderCorpo(); informarTamanho(); }

  // ───────── Eventos ─────────
  document.addEventListener('click', (e) => {
    const t = e.target;
    const a = t.closest('[data-a]');
    if (H().trav && !(a && a.dataset.a === 'destravar')) return undefined;
    const si = t.closest('[data-sinal]'); if (si) return ov.acao({ tipo: 'sinal', id: si.dataset.sinal, descartar: e.shiftKey });
    const ev = t.closest('[data-ev]'); if (ev) return ov.acao({ tipo: 'evid', id: ev.dataset.ev, descartar: e.shiftKey });
    const tm = t.closest('[data-tm]'); if (tm) return ov.acao(tm.dataset.tm === 'cacada' ? { tipo: 'cacada' } : { tipo: 'timer', id: tm.dataset.tm });
    if (!a) return undefined;
    switch (a.dataset.a) {
      case 'travar': return ov.hudConfig(K, { trav: true });
      case 'destravar': ov.capturarMouse(false); return ov.hudConfig(K, { trav: false });
      case 'ocultar': return ov.hudConfig(K, { vis: false });
      case 'dash': return ov.modo('dash');
      case 'zerar': return ov.acao({ tipo: 'zerar' });
      case 'toque': return ov.acao({ tipo: 'toque' });
      case 'toast-ok': if (aviso && aviso.marcar) ov.acao({ tipo: 'marcar', id: aviso.marcar.id, valor: aviso.marcar.valor, forcar: true }); aviso = null; return renderCorpo();
      default: return undefined;
    }
  });
  document.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    if (H().trav) return;
    const si = e.target.closest('[data-sinal]'); if (si) ov.acao({ tipo: 'sinal', id: si.dataset.sinal, descartar: true });
    const ev = e.target.closest('[data-ev]'); if (ev) ov.acao({ tipo: 'evid', id: ev.dataset.ev, descartar: true });
  });
  // Fundo e tamanho: mudam na hora; salvam ao soltar o controle.
  document.addEventListener('input', (e) => {
    const k = e.target.dataset && e.target.dataset.cfg; if (!k) return;
    H()[k] = +e.target.value; aplicarVisual(); informarTamanho();
  });
  document.addEventListener('change', (e) => {
    const k = e.target.dataset && e.target.dataset.cfg; if (!k) return;
    ov.hudConfig(K, { [k]: +e.target.value });
  });
  // Travado: o cadeado pega o mouse enquanto o cursor está em cima dele.
  document.addEventListener('mouseover', (e) => { if (C && H().trav && e.target.closest('.trava')) ov.capturarMouse(true); });
  document.addEventListener('mouseout', (e) => {
    if (C && H().trav && e.target.closest('.trava') && !(e.relatedTarget && e.relatedTarget.closest && e.relatedTarget.closest('.trava'))) ov.capturarMouse(false);
  });

  ov.on('estado', (s) => { S = s; renderCorpo(); });
  ov.on('config', (c) => { C = c; render(); });
  ov.on('aviso', (a) => { if (K !== 'f') return; aviso = a; clearTimeout(avisoT); avisoT = setTimeout(() => { aviso = null; renderCorpo(); }, 10000); renderCorpo(); });

  ov.iniciar().then(({ config, estado }) => { C = config; S = estado; render(); setInterval(tick, 250); });
})();
