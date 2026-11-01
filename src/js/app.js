/* HelpaEuPhasmo — interface (renderer). */
(function () {
  'use strict';

  const ov = window.overlay || null; // API do Electron (ausente quando aberto no navegador)
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const G = Object.fromEntries(FANTASMAS.map((g) => [g.id, g]));
  const E = Object.fromEntries(EVIDENCIAS.map((e) => [e.id, e]));
  const CHAVE = 'hep-estado-v1';

  const ROTULOS_ATALHO = {
    alternarVisivel: 'Mostrar / ocultar overlay',
    cliqueAtraves: 'Clique-através (mouse passa para o jogo)',
    alternarModo: 'Alternar Dashboard / HUD',
    novoContrato: 'Novo contrato',
    incenso: 'Cronômetro de incenso',
    cacada: 'Caçada: começou / terminou',
    passo: 'Toque de passos',
    cronometro: 'Cronômetro livre: iniciar / parar',
    zerar: 'Zerar cronômetros'
  };

  // ───────────────────────── Estado ─────────────────────────
  const estadoPadrao = () => ({
    contrato: { configurado: false, comEvid: true, dif: 'profissional', nEvidCustom: 3, mapa: null, velMult: 100, luaSangue: false, solo: false, hostAbaixo30: false },
    evid: {}, marcadores: {}, sanidadeCaca: null, manual: {}, palpite: null, notas: '',
    timers: {
      incenso: { inicio: null, acum: 0 },
      cacada: { inicio: null, fimUltima: null, hist: [] },
      contrato: { inicio: null, acum: 0 },
      livre: { inicio: null, acum: 0, voltas: [] }
    },
    vel: { hist: [] },
    ui: { aba: 'velocidade', mostrarDescartados: true, buscaMarc: '' }
  });

  let S = carregar();
  let cfg = { atalhos: {}, ui: { opacidade: 0.9, zoom: 1 } };
  let resultado = {};
  let ultimoUnico = null;

  function carregar() {
    try {
      const s = JSON.parse(localStorage.getItem(CHAVE));
      if (s && s.contrato) {
        const p = estadoPadrao();
        return Object.assign(p, s, { timers: Object.assign(p.timers, s.timers || {}), ui: Object.assign(p.ui, s.ui || {}) });
      }
    } catch (_) { /* estado inválido */ }
    return estadoPadrao();
  }
  let timerSalvar = null;
  function salvar() {
    clearTimeout(timerSalvar);
    timerSalvar = setTimeout(() => localStorage.setItem(CHAVE, JSON.stringify(S)), 150);
  }

  const dif = () => DIFICULDADES.find((d) => d.id === S.contrato.dif) || DIFICULDADES[2];
  function nEvid() {
    const c = S.contrato;
    if (!c.comEvid) return 0;
    if (c.dif === 'personalizada') return c.nEvidCustom;
    return dif().evid == null ? 3 : dif().evid;
  }
  const multVel = () => (S.contrato.velMult / 100) * (S.contrato.luaSangue ? 1.15 : 1);

  function estadoMotor() {
    return { nEvid: nEvid(), evid: S.evid, marcadores: S.marcadores, sanidadeCaca: S.sanidadeCaca, manual: S.manual, hostAbaixo30: S.contrato.hostAbaixo30 };
  }

  // ───────────────────────── Render geral ─────────────────────────
  function render() {
    resultado = Motor.avaliar(estadoMotor());
    document.body.classList.toggle('sem-evid', nEvid() === 0);
    renderContrato();
    renderEvid();
    renderSanidade();
    renderFantasmas();
    renderSugestoes();
    renderMarc();
    renderHud();
    renderCompat();
    salvar();
  }

  function vivos() { return FANTASMAS.filter((g) => resultado[g.id] && resultado[g.id].possivel); }

  function renderContrato() {
    const c = S.contrato;
    const d = dif();
    const n = nEvid();
    const mapa = c.mapa ? MAPAS[c.mapa].nome : 'mapa ?';
    $('#txt-contrato').textContent = c.configurado
      ? `${d.nome} • ${n === 0 ? 'SEM evidências' : n + ' evidência' + (n > 1 ? 's' : '')} • ${mapa}${c.velMult !== 100 ? ' • vel ' + c.velMult + '%' : ''}`
      : '⚙ Configurar contrato';
    const v = vivos();
    $('#txt-restam').innerHTML = `Restam <b>${v.length}</b> de ${FANTASMAS.length}`;
  }

  function cicloEvid(id, direto) {
    const atual = S.evid[id];
    let novo;
    if (direto === 'nao') novo = atual === 'nao' ? undefined : 'nao';
    else novo = atual === undefined ? 'sim' : atual === 'sim' ? 'nao' : undefined;
    if (novo === undefined) delete S.evid[id]; else S.evid[id] = novo;
    render();
  }

  function htmlEvidBotao(e, compacto) {
    const st = S.evid[e.id];
    const rest = Motor.evidenciasRestantes(estadoMotor(), resultado)[e.id];
    const impossivel = rest.possivelEm === 0;
    const cls = ['evid', st || '', impossivel ? 'impossivel' : ''].join(' ');
    const marca = st === 'sim' ? '✓' : st === 'nao' ? '✗' : '';
    return `<button class="${cls}" data-evid="${e.id}" data-id="${e.id}" title="${esc(e.dica)}">
      <span>${e.icone}</span><span class="nome">${esc(compacto ? e.curto : e.nome)}</span>
      ${compacto ? '' : `<span class="qtd">${rest.possivelEm}</span>`}<span class="estado">${marca}</span></button>`;
  }

  function renderEvid() {
    $('#lista-evid').innerHTML = EVIDENCIAS.map((e) => htmlEvidBotao(e, false)).join('');
    const n = nEvid();
    const achadas = Object.values(S.evid).filter((x) => x === 'sim').length;
    $('#txt-evid-contador').textContent = n === 0 ? '0 evid. · orbe = Mímico' : `${achadas}/${n}`;
  }

  const NIVEIS_SAN = [35, 40, 50, 60, 65, 70, 75, 80];
  function renderSanidade() {
    $('#lista-sanidade').innerHTML = NIVEIS_SAN.map((n) =>
      `<button class="btn ${S.sanidadeCaca === n ? 'ativo' : ''}" data-san="${n}" title="Caçou com sanidade média acima de ${n}%">&gt;${n}%</button>`).join('');
  }

  function renderFantasmas() {
    const busca = $('#busca').value.trim().toLowerCase();
    const mostrar = S.ui.mostrarDescartados;
    const v = vivos();
    const lista = FANTASMAS.slice().sort((a, b) => {
      const pa = resultado[a.id].possivel ? 0 : 1;
      const pb = resultado[b.id].possivel ? 0 : 1;
      return pa - pb || a.nome.localeCompare(b.nome);
    }).filter((g) => {
      if (!mostrar && !resultado[g.id].possivel) return false;
      if (!busca) return true;
      return (g.nome + ' ' + (g.nomePt || '')).toLowerCase().includes(busca);
    });
    const unico = v.length === 1 ? v[0].id : null;
    $('#grade-fantasmas').innerHTML = lista.map((g) => {
      const r = resultado[g.id];
      const evs = g.evid.concat(g.mimico ? ['orb'] : []).map((e) =>
        `<span class="ev ${S.evid[e] === 'sim' ? 'ok' : ''} ${g.forcada === e ? 'forc' : ''}" title="${esc(E[e].nome)}${g.forcada === e ? ' (garantida)' : ''}">${esc(E[e].curto)}</span>`).join('');
      const cls = ['fantasma', r.possivel ? '' : 'morto', S.palpite === g.id ? 'palpite' : '', unico === g.id ? 'unico' : ''].join(' ');
      return `<button class="${cls}" data-g="${g.id}" title="Clique: detalhes e testes • Botão direito: descartar/restaurar">
        ${g.adicionado ? '<span class="novo">NOVO</span>' : ''}
        <div class="topo"><span class="nome">${esc(g.nome)}</span>${g.nomePt ? `<span class="pt">${esc(g.nomePt)}</span>` : ''}</div>
        <div class="evs">${evs}</div>
        <div class="meta">Caça: <b>${esc(g.caca.curto || g.caca.texto)}</b> · Vel: <b>${esc(velCurta(g))}</b></div>
        ${r.possivel ? `<div class="resumo">${esc(g.resumo)}</div>` : `<div class="motivo">✗ ${esc(r.motivos[0])}</div>`}
      </button>`;
    }).join('');
    $('#alerta-nenhum').classList.toggle('oculto', v.length > 0);
    if (unico && unico !== ultimoUnico) {
      toast(`🎯 Só sobrou <b>${esc(G[unico].nome)}</b>! Confira os testes antes de marcar no diário.`, [{ rotulo: 'Ver detalhes', fn: () => abrirFantasma(unico) }], 9000);
    }
    ultimoUnico = unico;
  }

  function velCurta(g) {
    if (g.mimico) return 'copia';
    const f = g.vel.faixas;
    const min = Math.min(...f.map((x) => x[0]));
    const max = Math.max(...f.map((x) => x[1]));
    const fmt = (n) => n.toFixed(2).replace(/0$/, '').replace('.', ',');
    return min === max ? `${fmt(min)}${g.vel.los ? '+' : ''}` : `${fmt(min)}–${fmt(max)}`;
  }

  function renderSugestoes() {
    const sug = Motor.sugerirTestes(estadoMotor(), resultado, 6);
    const el = $('#lista-sugestoes');
    const v = vivos().filter((g) => !g.mimico);
    if (!sug.length) {
      el.innerHTML = `<div class="ajuda">${v.length <= 1 ? 'Nada a sugerir — confira o fantasma restante e os testes dele.' : 'Marque evidências ou características para receber sugestões.'}</div>`;
      $('#hud-sug').textContent = '';
      return;
    }
    el.innerHTML = sug.map((s) => `<button class="sug" data-marc-info="${s.m.id}">
        <div class="t">${esc(s.m.nome)}</div><div class="d">${esc(s.m.desc)}</div>
        <div class="g">Separa: ${s.envolvidos.map((id) => esc(G[id].nome)).join(', ')}</div></button>`).join('');
    $('#hud-sug').innerHTML = '💡 ' + sug.slice(0, 2).map((s) => esc(s.m.nome)).join(' · ');
  }

  function renderMarc() {
    const q = (S.ui.buscaMarc || '').trim().toLowerCase();
    $('#abas-marc').innerHTML = CATEGORIAS.map((c) => {
      const n = CARACTERISTICAS.filter((m) => m.cat === c.id && S.marcadores[m.id]).length;
      return `<button class="aba ${S.ui.aba === c.id && !q ? 'ativa' : ''}" data-aba="${c.id}">${c.icone} ${esc(c.nome)}${n ? `<span class="n">${n}</span>` : ''}</button>`;
    }).join('');
    const vivosIds = vivos().filter((g) => !g.mimico).map((g) => g.id);
    const lista = CARACTERISTICAS.filter((m) => (q ? (m.nome + ' ' + m.desc).toLowerCase().includes(q) : m.cat === S.ui.aba));
    $('#lista-marc').innerHTML = lista.map((m) => {
      const st = S.marcadores[m.id];
      const util = st || afetaAlguem(m, vivosIds);
      return `<div class="marc ${st || ''} ${util ? '' : 'inutil'}">
        <span class="txt" data-marc-info="${m.id}" title="${esc(m.desc)}">${esc(m.nome)}</span>
        <button class="bt s ${st === 'sim' ? 'on' : ''}" data-marc="${m.id}" data-v="sim" title="Sim, observei">✓</button>
        ${m.nao ? `<button class="bt n ${st === 'nao' ? 'on' : ''}" data-marc="${m.id}" data-v="nao" title="${esc(m.labelNao || 'Não')}">✗</button>` : ''}
      </div>`;
    }).join('') || '<div class="ajuda">Nenhuma característica encontrada.</div>';
  }
  function afetaAlguem(m, ids) {
    for (const r of [m.sim, m.nao]) {
      if (!r) continue;
      for (const id of ids) {
        if ((r.apenas && !r.apenas.includes(id)) || (r.exclui && r.exclui.includes(id))) return true;
      }
    }
    return false;
  }

  function renderHud() {
    const v = vivos();
    $('#hud-restam').innerHTML = `<div class="tit">Restam ${v.length} — ${esc($('#txt-contrato').textContent)}</div>` +
      v.map((g) => `<button class="g" data-g="${g.id}">${esc(g.nome)}</button>`).join('');
    $('#hud-evid').innerHTML = EVIDENCIAS.map((e) => htmlEvidBotao(e, true)).join('');
  }

  // ───────────────────────── Toque de passos ─────────────────────────
  let toques = [];
  let ultimaMedicao = null;
  function tocar() {
    const agora = performance.now();
    if (toques.length && agora - toques[toques.length - 1] > 2000) toques = [];
    toques.push(agora);
    if (toques.length > 12) toques.shift();
    ['#btn-toque', '#hud-toque'].forEach((s) => { const b = $(s); b.classList.add('pulso'); setTimeout(() => b.classList.remove('pulso'), 90); });
    if (toques.length >= 3) {
      const ints = [];
      for (let i = 1; i < toques.length; i++) ints.push(toques[i] - toques[i - 1]);
      const media = ints.reduce((a, b) => a + b, 0) / ints.length;
      const bpm = 60000 / media;
      ultimaMedicao = { bpm, v: Motor.bpmParaVelocidade(bpm) };
    } else {
      ultimaMedicao = null;
    }
    renderToque();
  }
  function renderToque() {
    const m = ultimaMedicao;
    const vel = m ? m.v.toFixed(2).replace('.', ',') + ' m/s' : '— m/s';
    const bpm = m ? `${Math.round(m.bpm)} passos/min (${toques.length} toques)` : (toques.length ? `${toques.length} toque(s)… continue` : 'toque no ritmo dos passos');
    $('#txt-vel').textContent = vel; $('#hud-vel').textContent = vel;
    $('#txt-bpm').textContent = bpm; $('#hud-bpm').textContent = m ? `${Math.round(m.bpm)} ppm` : 'passos';
    renderCompat();
  }
  function renderCompat() {
    const el = $('#txt-compat');
    if (!ultimaMedicao) { el.innerHTML = '<span class="ajuda">Padrão: 1,7 m/s ≈ 117 passos/min. Toque o atalho a cada passo durante a caçada.</span>'; return; }
    const base = []; const los = [];
    for (const g of vivos()) {
      if (g.mimico) continue;
      const c = Motor.velocidadeCompativel(g, ultimaMedicao.v, { multiplicador: multVel() });
      if (c === 'base') base.push(g.nome); else if (c === 'visao') los.push(g.nome);
    }
    el.innerHTML = `<div><b>Sem te ver:</b> ${base.length ? esc(base.join(', ')) : 'nenhum restante'}</div>` +
      (los.length ? `<div class="los">Só se estava te vendo: ${esc(los.join(', '))}</div>` : '');
  }
  function salvarMedicao() {
    if (!ultimaMedicao) return;
    S.vel.hist.unshift(ultimaMedicao.v.toFixed(2).replace('.', ','));
    S.vel.hist = S.vel.hist.slice(0, 8);
    renderHistVel(); salvar();
  }
  function renderHistVel() {
    $('#lista-vel').innerHTML = S.vel.hist.map((v, i) => `<span title="Medição ${S.vel.hist.length - i}">${v} m/s</span>`).join('');
  }

  // ───────────────────────── Cronômetros ─────────────────────────
  const T = () => S.timers;
  const agora = () => Date.now();
  const decorrido = (t) => (t.acum || 0) + (t.inicio ? agora() - t.inicio : 0);
  const fmt = (ms) => {
    const s = Math.max(0, Math.floor(ms / 1000));
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  };

  const TIMERS_DEF = [
    { id: 'incenso', nome: 'Incenso', sub: 'Inicie ao acender o incenso. Marcas em 60 s (Demon), 90 s (normal) e 180 s (Spirit).', botoes: [['alternar', '▶ / ⏸', 'Iniciar / parar'], ['reiniciar', '↺', 'Reiniciar do zero']], marcas: [60, 90, 180], max: 200 },
    { id: 'cacada', nome: 'Caçada', sub: 'Aperte quando a caçada começar e quando terminar.', botoes: [['alternar', 'Começou / Acabou', 'Caçada começou / terminou']] },
    { id: 'contrato', nome: 'Contrato', sub: 'Inicie quando abrir a porta da casa.', botoes: [['alternar', '▶ / ⏸', 'Porta aberta / pausar'], ['zerar', '↺', 'Zerar']] },
    { id: 'livre', nome: 'Livre', sub: 'Cronômetro livre e intervalo entre sons paranormais.', botoes: [['alternar', '▶ / ⏸', 'Iniciar / parar'], ['volta', '♪ Som', 'Ouvi um som paranormal (marca volta)'], ['zerar', '↺', 'Zerar']] }
  ];

  function montarTimers() {
    const html = (compacto) => TIMERS_DEF.filter((d) => !compacto || d.id !== 'livre').map((d) => `
      <div class="timer" data-timer="${d.id}" title="${esc(d.sub)}">
        <div class="linha"><span class="rot">${d.nome} <span class="atalho-dica" data-acao="${d.id === 'livre' ? 'cronometro' : d.id}"></span></span>
          ${compacto ? '' : `<span class="botoes">${d.botoes.map(([a, r, t]) => `<button class="btn" data-timer-acao="${a}" data-timer-id="${d.id}" title="${esc(t)}">${r}</button>`).join('')}</span>`}
          <span class="tempo">0:00</span></div>
        ${d.marcas ? `<div class="barra-prog"><i></i>${d.marcas.map((m) => `<span class="marca" style="left:${(m / d.max) * 100}%"></span>`).join('')}</div>` : ''}
        <div class="status"></div>
        ${compacto ? '' : '<div class="hist"></div>'}
      </div>`).join('');
    $('#timers').innerHTML = html(false);
    $('#hud-timers').innerHTML = html(true);
  }

  function acaoTimer(id, acao) {
    const t = T()[id];
    if (id === 'cacada') return alternarCacada();
    if (acao === 'alternar') {
      if (t.inicio) { t.acum = decorrido(t); t.inicio = null; }
      else {
        if (id === 'incenso') t.acum = 0; // novo incenso sempre do zero
        t.inicio = agora();
      }
    } else if (acao === 'reiniciar') { t.acum = 0; t.inicio = agora(); }
    else if (acao === 'zerar') { t.acum = 0; t.inicio = null; if (t.voltas) t.voltas = []; }
    else if (acao === 'volta') registrarSom();
    salvar(); tick();
  }

  function alternarCacada() {
    const c = T().cacada;
    if (!c.inicio) {
      // Começou uma caçada
      const sugestoes = [];
      if (c.fimUltima && agora() - c.fimUltima < 25000) {
        sugestoes.push(['c_cooldown', `Caçou ${Math.round((agora() - c.fimUltima) / 1000)} s depois da anterior (menos de 25 s) → aponta <b>Demon</b>.`]);
      }
      const inc = T().incenso;
      if (inc.inicio) {
        const s = decorrido(inc) / 1000;
        if (s >= 55 && s < 90) sugestoes.push(['c_incenso_60', `Caçou ${Math.round(s)} s após o incenso (60–90 s) → aponta <b>Demon</b>.`]);
        else if (s >= 90 && s < 180) sugestoes.push(['c_incenso_90', `Caçou ${Math.round(s)} s após o incenso (90–180 s) → descarta <b>Spirit</b>.`]);
        inc.acum = decorrido(inc); inc.inicio = null;
      }
      c.inicio = agora();
      sugestoes.forEach(([m, txt]) => sugerirMarcador(m, txt));
    } else {
      const dur = (agora() - c.inicio) / 1000;
      c.hist.push(Math.round(dur));
      c.hist = c.hist.slice(-8);
      c.inicio = null; c.fimUltima = agora();
      const esp = esperadaTotal();
      if (esp && dur < esp * 0.82 && dur > esp * 0.5) {
        sugerirMarcador('c_curta', `Caçada de ${Math.round(dur)} s (esperado ~${esp} s) — ~20% mais curta aponta <b>Obambo</b>. Lembre: uma morte também encerra ou estende a caçada.`);
      }
    }
    salvar(); tick();
  }
  function esperadaTotal() {
    const base = Motor.duracaoEsperada(S.contrato.dif, S.contrato.mapa);
    if (!base) return null;
    const graca = dif().graca == null ? 3 : dif().graca;
    return base + graca;
  }

  function registrarSom() {
    const l = T().livre;
    if (!l.inicio && !l.acum) l.inicio = agora();
    const t = decorrido(l);
    l.voltas.push(t);
    l.voltas = l.voltas.slice(-10);
    if (l.voltas.length >= 2) {
      const int = (l.voltas[l.voltas.length - 1] - l.voltas[l.voltas.length - 2]) / 1000;
      if (int < 80 && int > 3) sugerirMarcador('i_sons_80', `Dois sons com ${Math.round(int)} s de intervalo (< 80 s) → aponta <b>Myling</b>.`);
    }
    salvar();
  }

  function tick() {
    const t = T();
    // Incenso
    const sInc = decorrido(t.incenso) / 1000;
    let stInc = 'Pronto. Inicie ao acender o incenso perto do fantasma.'; let clsInc = '';
    if (t.incenso.inicio || t.incenso.acum) {
      if (sInc < 60) stInc = `Ninguém caça naturalmente por mais ${Math.ceil(60 - sInc)} s.`;
      else if (sInc < 90) { stInc = `Só o DEMON pode caçar agora (normal libera em ${Math.ceil(90 - sInc)} s).`; clsInc = 'alerta-t'; }
      else if (sInc < 180) { stInc = `Todos podem caçar — exceto SPIRIT (mais ${Math.ceil(180 - sInc)} s).`; clsInc = 'alerta-t'; }
      else { stInc = 'Proteção acabou para todos os fantasmas.'; clsInc = 'perigo-t'; }
    }
    atualizarTimer('incenso', t.incenso, stInc, clsInc, Math.min(1, sInc / 200));

    // Caçada
    const c = t.cacada;
    let stCac = ''; let clsCac = ''; let msCac = 0;
    const esp = esperadaTotal();
    if (c.inicio) {
      msCac = agora() - c.inicio;
      stCac = esp ? `Em andamento — esperado ~${esp} s (com graça).` : 'Em andamento. Configure o tamanho do mapa para comparar a duração.';
      clsCac = 'perigo-t';
    } else if (c.fimUltima) {
      const desde = (agora() - c.fimUltima) / 1000;
      msCac = agora() - c.fimUltima;
      if (desde < 20) { stCac = `Cooldown: nenhum caça por mais ${Math.ceil(20 - desde)} s (Demon) / ${Math.ceil(25 - desde)} s (outros).`; clsCac = 'alerta-t'; }
      else if (desde < 25) { stCac = `Só o DEMON pode caçar de novo (outros em ${Math.ceil(25 - desde)} s).`; clsCac = 'alerta-t'; }
      else stCac = `Última caçada terminou há ${fmt(msCac)}. Cooldown acabou.`;
    } else stCac = 'Aperte quando a caçada começar (luzes piscando) e quando acabar.';
    atualizarTimer('cacada', { inicio: c.inicio }, stCac, clsCac, null, msCac,
      c.hist.map((d) => `<span class="${esp && d < esp * 0.82 ? 'curta' : ''}">${d}s</span>`).join(''));

    // Contrato
    const sCon = decorrido(t.contrato) / 1000;
    let stCon = 'Inicie quando abrir a porta da casa.';
    if (t.contrato.inicio || t.contrato.acum) {
      if (sCon < 60) stCon = `Mímico, Thaye e Obambo começam a agir em ${Math.ceil(60 - sCon)} s.`;
      else {
        const fase = Math.floor((sCon - 60) / 120);
        const prox = 120 - ((sCon - 60) % 120);
        stCon = `Se for Obambo: ${fase % 2 === 0 ? 'AGRESSIVO' : 'calmo'} (troca em ${Math.ceil(prox)} s).`;
      }
    }
    atualizarTimer('contrato', t.contrato, stCon, '', null);

    // Livre
    const l = t.livre;
    const voltas = l.voltas || [];
    const ints = voltas.slice(1).map((v, i) => Math.round((v - voltas[i]) / 1000));
    atualizarTimer('livre', l, voltas.length ? `${voltas.length} som(ns) marcados${ints.length ? ' — último intervalo ' + ints[ints.length - 1] + ' s' : ''}` : 'Use "Som ouvido" no parabólico: < 80 s entre sons = Myling.', '', null, null,
      ints.map((d) => `<span class="${d < 80 ? 'curta' : ''}">${d}s</span>`).join(''));
  }

  function atualizarTimer(id, t, status, cls, prog, msFixo, histHtml) {
    const ms = msFixo != null ? msFixo : decorrido(t);
    $$(`[data-timer="${id}"]`).forEach((el) => {
      el.classList.toggle('rodando', !!t.inicio);
      $('.tempo', el).textContent = fmt(ms);
      const st = $('.status', el); st.textContent = status; st.className = 'status ' + (cls || '');
      const bar = $('.barra-prog i', el); if (bar && prog != null) bar.style.width = (prog * 100) + '%';
      const h = $('.hist', el); if (h && histHtml != null && h.innerHTML !== histHtml) h.innerHTML = histHtml;
    });
  }

  function zerarTimers() {
    S.timers = estadoPadrao().timers;
    salvar(); tick();
  }

  // ───────────────────────── Sugestões / toasts ─────────────────────────
  function sugerirMarcador(idMarc, html) {
    if (S.marcadores[idMarc]) return;
    toast(html, [{ rotulo: 'Marcar característica', fn: () => { S.marcadores[idMarc] = 'sim'; render(); } }]);
  }
  function toast(html, acoes, tempo) {
    const el = document.createElement('div');
    el.className = 'toast';
    el.innerHTML = `<div>${html}</div><div class="acoes-t">${(acoes || []).map((a, i) => `<button class="btn primario" data-i="${i}">${esc(a.rotulo)}</button>`).join('')}<button class="btn" data-x>Fechar</button></div>`;
    el.addEventListener('click', (ev) => {
      const b = ev.target.closest('button'); if (!b) return;
      if (b.dataset.i != null) acoes[+b.dataset.i].fn();
      el.remove();
    });
    $('#toasts').appendChild(el);
    while ($('#toasts').children.length > 4) $('#toasts').firstChild.remove();
    setTimeout(() => el.remove(), tempo || 15000);
  }

  // ───────────────────────── Modais ─────────────────────────
  let aoFecharModal = null;
  function abrirModal(titulo, html, opts = {}) {
    $('#modal-titulo').innerHTML = titulo;
    $('#modal-corpo').innerHTML = html;
    $('#modal').classList.toggle('largo', !!opts.largo);
    $('#fundo-modal').classList.remove('oculto');
    aoFecharModal = opts.aoFechar || null;
    $('#modal-corpo').scrollTop = 0;
  }
  function fecharModal() {
    $('#fundo-modal').classList.add('oculto');
    $('#modal-corpo').innerHTML = '';
    const f = aoFecharModal; aoFecharModal = null;
    if (f) f();
  }
  const lista = (arr) => arr && arr.length ? `<ul>${arr.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : '<p class="ajuda">—</p>';

  function abrirFantasma(id) {
    const g = G[id];
    const r = resultado[id];
    const evs = g.evid.map((e) => `<span class="chip ${S.evid[e] === 'sim' ? 'ok' : ''} ${g.forcada === e ? 'forc' : ''}">${E[e].icone} ${esc(E[e].nome)}${g.forcada === e ? ' — garantida' : ''}</span>`).join('') +
      (g.mimico ? `<span class="chip forc">${E.orb.icone} Orbe Fantasma (falsa, sempre aparece)</span>` : '');
    const testes = g.testes.map((t) => `<div class="teste ${t.nivel}"><div class="nv">${esc(t.nivel)}</div><div class="nm">${esc(t.titulo)}</div><div>${esc(t.texto)}</div></div>`).join('');
    const marcRel = CARACTERISTICAS.filter((m) => [m.sim, m.nao].some((x) => x && ((x.apenas || []).includes(id) || (x.exclui || []).includes(id))));
    const html = `
      ${r.possivel ? '' : `<div class="motivos"><b>Descartado por:</b>${lista(r.motivos)}</div>`}
      <p>${esc(g.resumo)}</p>
      <div>${evs}</div>
      <h3>Números</h3>
      <div class="stats">
        <div class="stat"><div class="k">Sanidade para caçar</div><div class="v">${esc(g.caca.texto)}</div></div>
        <div class="stat"><div class="k">Velocidade</div><div class="v">${esc(g.vel.texto)}</div></div>
        <div class="stat"><div class="k">Acelera ao te ver?</div><div class="v">${g.mimico ? 'Depende do copiado' : g.vel.los ? 'Sim' : 'Não'}</div></div>
        ${g.adicionado ? `<div class="stat"><div class="k">Adicionado em</div><div class="v">${esc(g.adicionado)}</div></div>` : ''}
      </div>
      <h3>Força e fraqueza</h3>
      <p><b>Força:</b> ${esc(g.forca)}</p><p><b>Fraqueza:</b> ${esc(g.fraqueza)}</p>
      <h3>Habilidades</h3>${lista(g.habilidades)}
      <h3>Sinais (tells)</h3>${lista(g.sinais)}
      <h3>Como testar</h3>${testes}
      <h3>Sem evidências</h3>${lista(g.semEvidencia)}
      <h3>Confundido com</h3>${lista(g.confundido)}
      <h3>Descartado se…</h3>${lista(g.descartadoPor)}
      <h3>Sobrevivência</h3>${lista(g.sobrevivencia)}
      ${marcRel.length ? `<h3>Características ligadas a ele</h3><div>${marcRel.map((m) => `<span class="chip">${esc(m.nome)}</span>`).join('')}</div>` : ''}
      <div class="rodape-modal">
        <button class="btn" id="m-descartar">${S.manual[id] ? 'Restaurar' : 'Descartar manualmente'}</button>
        <button class="btn primario" id="m-palpite">${S.palpite === id ? 'Remover palpite' : '★ Marcar como meu palpite'}</button>
      </div>`;
    abrirModal(`${esc(g.nome)}${g.nomePt ? ` <small style="color:var(--fraco);font-weight:400">${esc(g.nomePt)}</small>` : ''}`, html, { largo: false });
    $('#m-descartar').onclick = () => { if (S.manual[id]) delete S.manual[id]; else S.manual[id] = true; render(); abrirFantasma(id); };
    $('#m-palpite').onclick = () => { S.palpite = S.palpite === id ? null : id; render(); abrirFantasma(id); };
  }

  function abrirMarcInfo(idMarc) {
    const m = CARACTERISTICAS.find((x) => x.id === idMarc);
    const nomes = (ids) => ids.map((i) => esc(G[i].nome)).join(', ');
    const regra = (r, rot) => {
      if (!r) return '';
      const p = [];
      if (r.apenas) p.push(`mantém só: <b>${nomes(r.apenas)}</b> (+ Mímico)`);
      if (r.exclui) p.push(`descarta: <b>${nomes(r.exclui)}</b>`);
      return `<li><b>${rot}</b> → ${p.join('; ')}</li>`;
    };
    abrirModal(esc(m.nome), `<p>${esc(m.desc)}</p><h3>Efeito no filtro</h3><ul>${regra(m.sim, 'Sim (observei)')}${regra(m.nao, m.labelNao || 'Não')}</ul>
      <div class="rodape-modal">
        <button class="btn" data-set="">Limpar</button>
        ${m.nao ? `<button class="btn perigo" data-set="nao">✗ ${esc(m.labelNao || 'Não')}</button>` : ''}
        <button class="btn primario" data-set="sim">✓ Sim, observei</button>
      </div>`);
    $$('[data-set]', $('#modal-corpo')).forEach((b) => b.onclick = () => {
      if (b.dataset.set) S.marcadores[m.id] = b.dataset.set; else delete S.marcadores[m.id];
      fecharModal(); render();
    });
  }

  // Configuração do contrato (dificuldade, evidências, mapa…)
  function abrirSetup(novo) {
    const c = JSON.parse(JSON.stringify(S.contrato));
    const desenhar = () => {
      const difsCom = DIFICULDADES.filter((d) => d.id !== 'apocalipse');
      const difsSem = DIFICULDADES.filter((d) => d.id === 'apocalipse' || d.id === 'personalizada');
      const difs = c.comEvid ? difsCom : difsSem;
      if (!difs.some((d) => d.id === c.dif)) c.dif = c.comEvid ? 'profissional' : 'apocalipse';
      const d = DIFICULDADES.find((x) => x.id === c.dif);
      const n = !c.comEvid ? 0 : c.dif === 'personalizada' ? c.nEvidCustom : d.evid;
      const idxMapa = { pequeno: 0, medio: 1, grande: 2 }[c.mapa];
      const durTxt = idxMapa != null ? `${d.duracaoCaca[idxMapa]} s (+ graça)` : `Pequeno ${d.duracaoCaca[0]} s · Médio ${d.duracaoCaca[1]} s · Grande ${d.duracaoCaca[2]} s`;
      $('#modal-corpo').innerHTML = `
        <div class="passo-setup"><div class="q">1. Você está jogando com evidências?</div>
          <div class="opcoes">
            <button class="btn ${c.comEvid ? 'ativo' : ''}" data-com="1">Sim, com evidências<small>Amador até Insanidade / personalizada</small></button>
            <button class="btn ${!c.comEvid ? 'ativo' : ''}" data-com="0">Não — 0 evidências<small>Só comportamento (orbe = Mímico)</small></button>
          </div></div>
        <div class="passo-setup"><div class="q">2. Dificuldade</div>
          <div class="opcoes">${difs.map((x) => `<button class="btn ${x.id === c.dif ? 'ativo' : ''}" data-dif="${x.id}">${esc(x.nome)}<small>${x.evid == null ? (c.comEvid ? '1 a 3 evidências' : '0 evidências') : x.evid + ' evidência' + (x.evid === 1 ? '' : 's')}</small></button>`).join('')}</div>
          ${c.comEvid && c.dif === 'personalizada' ? `<div class="linha-form">Evidências no personalizado: ${[1, 2, 3].map((k) => `<button class="btn ${c.nEvidCustom === k ? 'ativo' : ''}" data-nev="${k}">${k}</button>`).join('')}</div>` : ''}
        </div>
        <div class="passo-setup"><div class="q">3. Tamanho do mapa <span class="ajuda">(para comparar a duração das caçadas)</span></div>
          <div class="opcoes">${Object.entries(MAPAS).map(([k, m]) => `<button class="btn ${c.mapa === k ? 'ativo' : ''}" data-mapa="${k}" title="${esc(m.exemplos)}">${m.nome}<small>${esc(m.exemplos.split(',').slice(0, 2).join(','))}…</small></button>`).join('')}
            <button class="btn ${!c.mapa ? 'ativo' : ''}" data-mapa="">Não sei</button></div></div>
        <div class="passo-setup"><div class="q">4. Opções</div>
          <div class="linha-form">Velocidade do fantasma (personalizada): <input type="range" min="50" max="150" step="25" value="${c.velMult}" id="s-vel"><span class="val" id="s-vel-v">${c.velMult}%</span></div>
          <label class="linha-form"><input type="checkbox" id="s-lua" ${c.luaSangue ? 'checked' : ''}> Lua de Sangue / evento com fantasma +15% mais rápido</label>
          <label class="linha-form"><input type="checkbox" id="s-host" ${c.hostAbaixo30 ? 'checked' : ''}> Host abaixo do nível 30 (prestígio 0) — Deogen não aparece</label>
          <label class="linha-form"><input type="checkbox" id="s-solo" ${c.solo ? 'checked' : ''}> Jogando solo (dreno de sanidade pela metade)</label>
        </div>
        <div class="resumo-dif"><b>${esc(d.nome)}</b> — ${n === 0 ? 'SEM evidências' : n + ' evidência(s)'}
          <ul>
            ${d.sanidadeInicial != null ? `<li>Sanidade inicial ${d.sanidadeInicial}% · remédio +${d.remedio}% · dreno ${esc(d.dreno)}</li>` : ''}
            <li>Setup: ${esc(d.setup)} · Graça na caçada: ${d.graca != null ? d.graca + ' s' : 'ajustável'} · Duração da caçada: ${durTxt}</li>
            ${d.notas.map((x) => `<li>${esc(x)}</li>`).join('')}
          </ul></div>
        <div class="rodape-modal">
          ${novo ? '' : '<button class="btn" id="s-cancelar">Cancelar</button>'}
          <button class="btn primario" id="s-ok">${novo ? 'Começar contrato' : 'Salvar'}</button>
        </div>`;
      const corpo = $('#modal-corpo');
      $$('[data-com]', corpo).forEach((b) => b.onclick = () => { c.comEvid = b.dataset.com === '1'; desenhar(); });
      $$('[data-dif]', corpo).forEach((b) => b.onclick = () => { c.dif = b.dataset.dif; desenhar(); });
      $$('[data-nev]', corpo).forEach((b) => b.onclick = () => { c.nEvidCustom = +b.dataset.nev; desenhar(); });
      $$('[data-mapa]', corpo).forEach((b) => b.onclick = () => { c.mapa = b.dataset.mapa || null; desenhar(); });
      $('#s-vel').oninput = (e) => { c.velMult = +e.target.value; $('#s-vel-v').textContent = c.velMult + '%'; };
      $('#s-lua').onchange = (e) => { c.luaSangue = e.target.checked; };
      $('#s-host').onchange = (e) => { c.hostAbaixo30 = e.target.checked; };
      $('#s-solo').onchange = (e) => { c.solo = e.target.checked; };
      if ($('#s-cancelar')) $('#s-cancelar').onclick = fecharModal;
      $('#s-ok').onclick = () => {
        if (novo) {
          const ui = S.ui;
          S = estadoPadrao();
          S.ui = ui;
          $('#notas').value = '';
          toques = []; ultimaMedicao = null;
          renderToque(); renderHistVel();
        }
        c.configurado = true;
        S.contrato = c;
        fecharModal(); render(); tick();
      };
    };
    abrirModal(novo ? 'Novo contrato' : 'Configurar contrato', '', { largo: false });
    desenhar();
  }

  function abrirGuia(aba) {
    aba = aba || 'dificuldades';
    const abas = [['dificuldades', 'Dificuldades'], ['mecanicas', 'Mecânicas'], ['semevid', 'Sem evidência + dicas pro'], ['evid', 'Evidências'], ['tabela', 'Tabela de fantasmas'], ['amaldicoados', 'Itens amaldiçoados'], ['fontes', 'Fontes']];
    let corpo = '';
    if (aba === 'dificuldades') {
      corpo = `<table class="tabela"><tr><th>Dificuldade</th><th>Evid.</th><th>Sanidade</th><th>Remédio</th><th>Dreno</th><th>Setup</th><th>Graça</th><th>Caçada P/M/G</th></tr>
        ${DIFICULDADES.map((d) => `<tr class="${d.id === S.contrato.dif ? 'sel' : ''}"><td><b>${esc(d.nome)}</b><div class="ajuda">${esc(d.notas.join(' '))}</div></td>
        <td>${d.evid == null ? '0–3' : d.evid}</td><td>${d.sanidadeInicial == null ? '—' : d.sanidadeInicial + '%'}</td><td>${d.remedio == null ? '—' : '+' + d.remedio + '%'}</td>
        <td>${esc(d.dreno)}</td><td>${esc(d.setup)}</td><td>${d.graca == null ? '0–5 s' : d.graca + ' s'}</td><td>${d.duracaoCaca.join(' / ')} s</td></tr>`).join('')}</table>
        <p class="ajuda">Personalizada: evidências 0–3, velocidade do fantasma 50–150%, sanidade inicial, remédio, dreno, corrida, lanterna, graça 0–5 s, duração da caçada, mortes estendem a caçada, frequência de eventos/interações/vagar, troca de cômodo, esconderijos, portas abertas, disjuntor, monitores e itens amaldiçoados.</p>`;
    } else if (aba === 'mecanicas') {
      corpo = GUIA.mecanicas.map((s) => `<h3>${esc(s.titulo)}</h3>${lista(s.itens)}`).join('');
    } else if (aba === 'semevid') {
      corpo = GUIA.semEvidencia.map((s) => `<h3>${esc(s.titulo)}</h3>${lista(s.itens)}`).join('');
    } else if (aba === 'evid') {
      corpo = EVIDENCIAS.map((e) => `<h3>${e.icone} ${esc(e.nome)}</h3><p>${esc(e.dica)}</p><p class="ajuda">Fantasmas: ${FANTASMAS.filter((g) => g.evid.includes(e.id) || (g.mimico && e.id === 'orb')).map((g) => esc(g.nome) + (g.forcada === e.id ? ' (garantida)' : '')).join(', ')}</p>`).join('');
    } else if (aba === 'tabela') {
      corpo = `<table class="tabela"><tr><th>Fantasma</th>${EVIDENCIAS.map((e) => `<th title="${esc(e.nome)}">${e.icone}</th>`).join('')}<th>Caça</th><th>Velocidade</th></tr>
        ${FANTASMAS.slice().sort((a, b) => a.nome.localeCompare(b.nome)).map((g) => `<tr><td><b>${esc(g.nome)}</b></td>${EVIDENCIAS.map((e) => `<td>${g.evid.includes(e.id) || (g.mimico && e.id === 'orb') ? (g.forcada === e.id ? '★' : '●') : ''}</td>`).join('')}<td>${esc(g.caca.texto)}</td><td>${esc(g.vel.texto)}</td></tr>`).join('')}</table>
        <p class="ajuda">★ = evidência garantida em Pesadelo/Insanidade. Mímico: orbes falsas extras.</p>`;
    } else if (aba === 'amaldicoados') {
      corpo = lista(GUIA.amaldicoados);
    } else {
      corpo = `<p>Dados conferidos para a versão <b>v0.19.x</b> (outubro de 2026), incluindo Dayan, Gallu e Obambo (v0.15.1), Kormos e Aswang (v0.17.1) e Deildegast (v0.18.0).</p><ul>${GUIA.fontes.map((f) => `<li><a href="${esc(f.url)}" target="_blank" rel="noopener">${esc(f.nome)}</a></li>`).join('')}</ul>
        <p class="ajuda">Projeto de fãs, sem afiliação com a Kinetic Games. Números podem mudar em atualizações futuras do jogo.</p>`;
    }
    abrirModal('📘 Guia rápido', `<div class="abas-guia">${abas.map(([k, r]) => `<button class="aba ${k === aba ? 'ativa' : ''}" data-guia="${k}">${r}</button>`).join('')}</div>${corpo}`, { largo: true });
    $$('[data-guia]', $('#modal-corpo')).forEach((b) => b.onclick = () => abrirGuia(b.dataset.guia));
  }

  // Configurações: opacidade, zoom e atalhos
  function abrirConfig() {
    const at = Object.assign({}, cfg.atalhos);
    let gravando = null;
    const desenhar = () => {
      $('#modal-corpo').innerHTML = `
        <h3>Aparência</h3>
        <div class="linha-form">Opacidade do fundo <input type="range" min="0.35" max="1" step="0.05" value="${cfg.ui.opacidade}" id="c-op"><span class="val" id="c-op-v">${Math.round(cfg.ui.opacidade * 100)}%</span></div>
        <div class="linha-form">Tamanho da interface <input type="range" min="0.75" max="1.4" step="0.05" value="${cfg.ui.zoom}" id="c-zoom"><span class="val" id="c-zoom-v">${Math.round(cfg.ui.zoom * 100)}%</span></div>
        <h3>Atalhos globais (funcionam com o jogo em foco)</h3>
        ${ov ? '' : '<p class="ajuda">Atalhos globais só funcionam no aplicativo (Electron).</p>'}
        <table class="tabela">${Object.keys(ROTULOS_ATALHO).map((k) => `<tr><td>${esc(ROTULOS_ATALHO[k])}</td>
          <td><button class="atalho-campo ${gravando === k ? 'gravando' : ''}" data-at="${k}">${gravando === k ? 'Pressione a combinação… (Esc cancela, Backspace limpa)' : esc(at[k] || '— nenhum —')}</button></td></tr>`).join('')}</table>
        <p class="ajuda">Dica: use teclas que o Phasmophobia não usa (F6–F10, Ctrl+Alt+letra). Evite Alt+Shift (troca o idioma do teclado no Windows).</p>
        <div class="rodape-modal">
          <button class="btn" id="c-padrao">Restaurar padrões</button>
          <button class="btn primario" id="c-ok">Salvar atalhos</button>
        </div>`;
      const corpo = $('#modal-corpo');
      $('#c-op').oninput = (e) => { cfg.ui.opacidade = +e.target.value; $('#c-op-v').textContent = Math.round(cfg.ui.opacidade * 100) + '%'; aplicarUi(); };
      $('#c-zoom').oninput = (e) => { cfg.ui.zoom = +e.target.value; $('#c-zoom-v').textContent = Math.round(cfg.ui.zoom * 100) + '%'; aplicarUi(); };
      $('#c-op').onchange = $('#c-zoom').onchange = salvarUi;
      $$('[data-at]', corpo).forEach((b) => b.onclick = () => { gravando = b.dataset.at; if (ov) ov.pausarAtalhos(true); desenhar(); });
      $('#c-padrao').onclick = () => { Object.assign(at, cfg.atalhosPadrao || {}); desenhar(); };
      $('#c-ok').onclick = async () => {
        gravando = null;
        if (ov) {
          const r = await ov.definirAtalhos(at);
          cfg.atalhos = r.atalhos;
          if (r.falhas.length) toast('Não consegui registrar: ' + r.falhas.map((f) => esc(f.acel)).join(', ') + '. Outro programa pode estar usando.', []);
          else toast('Atalhos salvos ✔', [], 3000);
        } else cfg.atalhos = at;
        dicasAtalho(); fecharModal();
      };
    };
    const tecla = (e) => {
      if (!gravando) return;
      e.preventDefault(); e.stopPropagation();
      if (e.key === 'Escape') { gravando = null; if (ov) ov.pausarAtalhos(false); desenhar(); return; }
      if (e.key === 'Backspace') { at[gravando] = ''; gravando = null; if (ov) ov.pausarAtalhos(false); desenhar(); return; }
      const k = teclaAcelerador(e);
      if (!k) return; // só modificador por enquanto
      const partes = [];
      if (e.ctrlKey) partes.push('Control');
      if (e.altKey) partes.push('Alt');
      if (e.shiftKey) partes.push('Shift');
      if (e.metaKey) partes.push('Super');
      partes.push(k);
      at[gravando] = partes.join('+');
      gravando = null;
      if (ov) ov.pausarAtalhos(false);
      desenhar();
    };
    document.addEventListener('keydown', tecla, true);
    abrirModal('⚙️ Configurações', '', { aoFechar: () => { document.removeEventListener('keydown', tecla, true); if (ov) ov.pausarAtalhos(false); } });
    desenhar();
  }
  function teclaAcelerador(e) {
    const c = e.code;
    if (/^Key[A-Z]$/.test(c)) return c.slice(3);
    if (/^Digit[0-9]$/.test(c)) return c.slice(5);
    if (/^F([1-9]|1[0-9]|2[0-4])$/.test(c)) return c;
    if (/^Numpad[0-9]$/.test(c)) return 'num' + c.slice(6);
    const mapa = { Space: 'Space', Tab: 'Tab', Enter: 'Enter', ArrowUp: 'Up', ArrowDown: 'Down', ArrowLeft: 'Left', ArrowRight: 'Right', Insert: 'Insert', Delete: 'Delete', Home: 'Home', End: 'End', PageUp: 'PageUp', PageDown: 'PageDown',
      NumpadAdd: 'numadd', NumpadSubtract: 'numsub', NumpadMultiply: 'nummult', NumpadDivide: 'numdiv', NumpadDecimal: 'numdec', Minus: '-', Equal: '=', BracketLeft: '[', BracketRight: ']', Semicolon: ';', Quote: "'", Comma: ',', Period: '.', Slash: '/', Backslash: '\\', Backquote: '`', Pause: 'Pause', ScrollLock: 'Scrolllock' };
    return mapa[c] || null;
  }

  function aplicarUi() {
    document.documentElement.style.setProperty('--alfa', cfg.ui.opacidade);
    document.documentElement.style.zoom = cfg.ui.zoom;
  }
  function salvarUi() {
    if (ov) ov.salvarUi(cfg.ui); else localStorage.setItem('hep-ui', JSON.stringify(cfg.ui));
  }
  function dicasAtalho() {
    $$('.atalho-dica[data-acao]').forEach((el) => {
      const a = cfg.atalhos[el.dataset.acao];
      el.textContent = a ? a.replace('Control', 'Ctrl') : '';
    });
  }

  // ───────────────────────── Ações globais ─────────────────────────
  function executar(acao) {
    switch (acao) {
      case 'incenso': return acaoTimer('incenso', 'alternar');
      case 'cacada': return alternarCacada();
      case 'passo': return tocar();
      case 'cronometro': return acaoTimer('livre', 'alternar');
      case 'zerar': return zerarTimers();
      case 'novoContrato': return abrirSetup(true);
      default: return undefined;
    }
  }
  function definirModoLocal(modo) {
    document.body.classList.toggle('modo-hud', modo === 'hud');
    document.body.classList.toggle('modo-dashboard', modo !== 'hud');
    $('#btn-modo').title = modo === 'hud' ? 'Abrir o Dashboard completo' : 'Mudar para o HUD compacto';
  }

  // ───────────────────────── Eventos ─────────────────────────
  function ligarEventos() {
    document.addEventListener('click', (e) => {
      const t = e.target;
      const ev = t.closest('[data-evid]'); if (ev) return cicloEvid(ev.dataset.evid);
      const san = t.closest('[data-san]'); if (san) { const n = +san.dataset.san; S.sanidadeCaca = S.sanidadeCaca === n ? null : n; return render(); }
      const g = t.closest('[data-g]'); if (g) return abrirFantasma(g.dataset.g);
      const mk = t.closest('[data-marc]'); if (mk) {
        const id = mk.dataset.marc; const v = mk.dataset.v;
        if (S.marcadores[id] === v) delete S.marcadores[id]; else S.marcadores[id] = v;
        return render();
      }
      const mi = t.closest('[data-marc-info]'); if (mi) return abrirMarcInfo(mi.dataset.marcInfo);
      const aba = t.closest('[data-aba]'); if (aba) { S.ui.aba = aba.dataset.aba; S.ui.buscaMarc = ''; $('#busca-marc').value = ''; return render(); }
      const ta = t.closest('[data-timer-acao]'); if (ta) return acaoTimer(ta.dataset.timerId, ta.dataset.timerAcao);
      return undefined;
    });
    document.addEventListener('contextmenu', (e) => {
      const ev = e.target.closest('[data-evid]');
      if (ev) { e.preventDefault(); return cicloEvid(ev.dataset.evid, 'nao'); }
      const g = e.target.closest('[data-g]');
      if (g) { e.preventDefault(); const id = g.dataset.g; if (S.manual[id]) delete S.manual[id]; else S.manual[id] = true; return render(); }
      return undefined;
    });
    $('#busca').addEventListener('input', renderFantasmas);
    $('#busca-marc').addEventListener('input', (e) => { S.ui.buscaMarc = e.target.value; renderMarc(); });
    $('#chk-descartados').checked = S.ui.mostrarDescartados;
    $('#chk-descartados').addEventListener('change', (e) => { S.ui.mostrarDescartados = e.target.checked; render(); });
    $('#btn-san-limpar').onclick = () => { S.sanidadeCaca = null; render(); };
    $('#btn-marc-limpar').onclick = () => { S.marcadores = {}; render(); };
    $('#btn-toque').addEventListener('mousedown', tocar);
    $('#hud-toque').addEventListener('mousedown', tocar);
    $('#btn-toque-reset').onclick = () => { toques = []; ultimaMedicao = null; renderToque(); };
    $('#btn-toque-salvar').onclick = salvarMedicao;
    $('#btn-zerar-timers').onclick = zerarTimers;
    $('#notas').value = S.notas || '';
    $('#notas').addEventListener('input', (e) => { S.notas = e.target.value; salvar(); });
    $('#btn-contrato').onclick = () => abrirSetup(false);
    $('#btn-novo').onclick = () => abrirSetup(true);
    $('#btn-guia').onclick = () => abrirGuia();
    $('#btn-config').onclick = abrirConfig;
    $('#modal-fechar').onclick = fecharModal;
    $('#fundo-modal').addEventListener('mousedown', (e) => { if (e.target.id === 'fundo-modal') fecharModal(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !$('#fundo-modal').classList.contains('oculto')) fecharModal(); });

    $('#btn-modo').onclick = () => {
      const hud = !document.body.classList.contains('modo-hud');
      if (ov) ov.modo(hud ? 'hud' : 'dashboard'); else definirModoLocal(hud ? 'hud' : 'dashboard');
    };
    $('#btn-clique').onclick = () => { if (ov) ov.cliqueAtraves(true); };
    $('#btn-ocultar').onclick = () => { if (ov) ov.ocultar(); };
    $('#btn-fechar').onclick = () => { if (ov) ov.fechar(); else window.close(); };

    // Redimensionar (janelas transparentes não têm borda nativa)
    const grip = $('#resize');
    grip.addEventListener('mousedown', (e) => {
      e.preventDefault();
      const x0 = e.screenX; const y0 = e.screenY; const w0 = window.outerWidth; const h0 = window.outerHeight;
      let raf = null;
      const mover = (ev) => {
        if (raf) return;
        raf = requestAnimationFrame(() => { raf = null; if (ov) ov.redimensionar(w0 + ev.screenX - x0, h0 + ev.screenY - y0); });
      };
      const soltar = () => { window.removeEventListener('mousemove', mover); window.removeEventListener('mouseup', soltar); };
      window.addEventListener('mousemove', mover);
      window.addEventListener('mouseup', soltar);
    });

    if (ov) {
      ov.on('atalho', executar);
      ov.on('estado:modo', definirModoLocal);
      ov.on('estado:clique-atraves', (v) => {
        $('#selo-clique').classList.toggle('oculto', !v);
        $('#btn-clique').classList.toggle('ativo', !!v);
      });
      ov.on('atalhos:falhas', (f) => toast('Alguns atalhos não puderam ser registrados: ' + f.map((x) => esc(x.acel)).join(', ') + '. Troque em ⚙️ Configurações.', []));
    }
  }

  // ───────────────────────── Início ─────────────────────────
  async function iniciar() {
    montarTimers();
    ligarEventos();
    if (ov) {
      const c = await ov.obterConfig();
      cfg = { atalhos: c.atalhos, atalhosPadrao: c.atalhosPadrao, ui: Object.assign({ opacidade: 0.9, zoom: 1 }, c.ui || {}) };
      definirModoLocal(c.modo);
      if (c.cliqueAtraves) $('#selo-clique').classList.remove('oculto');
    } else {
      try { cfg.ui = Object.assign(cfg.ui, JSON.parse(localStorage.getItem('hep-ui')) || {}); } catch (_) { /* padrão */ }
      cfg.atalhosPadrao = {};
    }
    aplicarUi();
    dicasAtalho();
    render();
    renderToque();
    renderHistVel();
    tick();
    setInterval(tick, 250);
    if (!S.contrato.configurado) abrirSetup(true);
  }

  // Exposto para testes automatizados
  window.HEP = { estado: () => S, executar, render, abrirGuia, abrirFantasma, abrirSetup };
  iniciar();
})();
