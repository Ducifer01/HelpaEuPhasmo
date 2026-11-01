/*
 * Estado da partida (contrato, evidências, marcações, cronômetros) e as ações que o mudam.
 * Funções puras: o processo principal guarda o estado e repassa para o Dashboard e os HUDs.
 * Testadas em tests/estado.test.js.
 */
(function (root) {
  const dados = (typeof module !== 'undefined' && module.exports)
    ? Object.assign({}, require('../data/evidencias.js'), require('../data/fantasmas.js'), require('../data/caracteristicas.js'))
    : root;
  const Motor = (typeof module !== 'undefined' && module.exports) ? require('./motor.js') : root.Motor;

  /** Ordem das evidências na tela e nos atalhos (1 a 7). */
  const ORDEM_EV = ['emf', 'box', 'uv', 'orb', 'writing', 'freezing', 'dots'];

  /** Contrato sem evidências: sinais que só um fantasma dá (atalhos 1 a 0). */
  const SINAIS = [
    { id: 'orb', ev: true, curto: 'Orbe', g: 'Mímico', dica: 'Orbes aparecem até com 0 evidências: só o Mímico' },
    { id: 'e_grito', curto: 'Grito', g: 'Banshee' },
    { id: 'i_luz_apagou', curto: 'Apaga luz', g: 'Mare' },
    { id: 'e_seis_dedos', curto: '6 dedos', g: 'Obake' },
    { id: 'c_respiracao', curto: 'Resp. fria', g: 'Hantu' },
    { id: 'i_explosao', curto: 'Explosão', g: 'Poltergeist' },
    { id: 'e_resp_box', curto: 'Resp. Box', g: 'Deogen' },
    { id: 'i_porta_15', curto: 'Porta 15%', g: 'Yurei' },
    { id: 'e_foto_some', curto: 'Foto some', g: 'Phantom' },
    { id: 'i_emf_chao', curto: 'EMF chão', g: 'Wraith' }
  ];

  const CONTRATO_PADRAO = { dif: 'profissional', nEvidCustom: 3, mapa: 'medio', vel: 100, host30: false };
  const timersVazios = () => ({ incenso: { ini: null, acum: 0 }, cacada: { ini: null, fim: null, hist: [] }, contrato: { ini: null, acum: 0 } });

  function estadoInicial() {
    return {
      contrato: Object.assign({}, CONTRATO_PADRAO), ultimo: null, configurado: false,
      evid: {}, marc: {}, san: null, manual: {},
      t: timersVazios(), toques: [], med: null
    };
  }

  /** Normaliza um estado salvo em disco (versões antigas ou arquivo corrompido). */
  function normalizar(e) {
    const base = estadoInicial();
    if (!e || typeof e !== 'object') return base;
    const o = Object.assign(base, e);
    o.contrato = Object.assign({}, CONTRATO_PADRAO, e.contrato || {});
    o.t = Object.assign(timersVazios(), e.t || {});
    if (!Array.isArray(o.t.cacada.hist)) o.t.cacada.hist = [];
    for (const k of ['evid', 'marc', 'manual']) if (!o[k] || typeof o[k] !== 'object') o[k] = {};
    if (!Array.isArray(o.toques)) o.toques = [];
    return o;
  }

  const difDados = (c) => {
    const id = c.dif === 'semevid' ? 'apocalipse' : c.dif;
    return dados.DIFICULDADES.find((d) => d.id === id) || dados.DIFICULDADES.find((d) => d.id === 'profissional');
  };
  function nEvid(c) {
    if (c.dif === 'semevid') return 0;
    if (c.dif === 'personalizada') return c.nEvidCustom == null ? 3 : c.nEvidCustom;
    const d = difDados(c);
    return d.evid == null ? 3 : d.evid;
  }
  const nomeDif = (c) => (c.dif === 'semevid' ? 'Sem evidências' : difDados(c).nome);

  /** Entrada do Motor.avaliar a partir do estado. */
  function paraMotor(e) {
    return { nEvid: nEvid(e.contrato), evid: e.evid, marcadores: e.marc, sanidadeCaca: e.san, manual: e.manual, hostAbaixo30: !!e.contrato.host30 };
  }

  const decorrido = (t, agora) => (t.acum || 0) + (t.ini ? agora - t.ini : 0);

  function ciclarEvid(e, id, descartar) {
    const st = e.evid[id];
    if (descartar) { if (st === 'nao') delete e.evid[id]; else e.evid[id] = 'nao'; return; }
    if (!st) e.evid[id] = 'sim';
    else if (st === 'sim') e.evid[id] = 'nao';
    else delete e.evid[id];
  }
  function alternarSinal(e, id, descartar) {
    const s = SINAIS.find((x) => x.id === id);
    if (!s) return;
    if (s.ev) return ciclarEvid(e, 'orb', descartar);
    if (e.marc[id]) delete e.marc[id]; else e.marc[id] = 'sim';
  }

  /** Duração esperada (s) da caçada, já com o tempo de graça. */
  function cacadaEsperada(c) {
    const d = difDados(c);
    const i = { pequeno: 0, medio: 1, grande: 2 }[c.mapa];
    if (i == null) return null;
    return d.duracaoCaca[i] + (d.graca == null ? 3 : d.graca);
  }

  /**
   * Aplica uma ação. Retorna { estado, aviso } — o aviso (opcional) é uma sugestão de marcação
   * mostrada como notificação: { texto, marcar: { id, valor } }.
   */
  function aplicar(estadoAtual, acao, agora) {
    agora = agora || Date.now();
    const e = JSON.parse(JSON.stringify(estadoAtual));
    let aviso = null;
    switch (acao && acao.tipo) {
      case 'evid': ciclarEvid(e, acao.id, !!acao.descartar); break;
      case 'sinal': alternarSinal(e, acao.id, !!acao.descartar); break;
      case 'evidAtalho': {
        const n = acao.n; // 1..10
        if (nEvid(e.contrato) === 0) { const s = SINAIS[n - 1]; if (s) alternarSinal(e, s.id, false); } else if (ORDEM_EV[n - 1]) ciclarEvid(e, ORDEM_EV[n - 1], false);
        break;
      }
      case 'limparEvid':
        e.evid = {};
        if (nEvid(e.contrato) === 0) SINAIS.forEach((s) => { if (!s.ev) delete e.marc[s.id]; });
        break;
      case 'marcar': if (e.marc[acao.id] === acao.valor && !acao.forcar) delete e.marc[acao.id]; else e.marc[acao.id] = acao.valor; break;
      case 'desmarcar': delete e.marc[acao.id]; break;
      case 'sanidade': e.san = e.san === acao.valor ? null : acao.valor; break;
      case 'manual': if (e.manual[acao.id]) delete e.manual[acao.id]; else e.manual[acao.id] = true; break;
      case 'contrato': {
        const c = Object.assign({}, CONTRATO_PADRAO, acao.contrato || {});
        if (e.configurado) e.ultimo = Object.assign({}, e.contrato);
        e.contrato = c; e.configurado = true;
        e.evid = {}; e.marc = {}; e.san = null; e.manual = {}; e.t = timersVazios(); e.toques = []; e.med = null;
        break;
      }
      case 'timer': {
        const t = e.t[acao.id];
        if (!t || acao.id === 'cacada') break;
        if (t.ini) { t.acum = decorrido(t, agora); t.ini = null; } else { if (acao.id === 'incenso') t.acum = 0; t.ini = agora; }
        break;
      }
      case 'cacada': {
        const c = e.t.cacada;
        if (!c.ini) {
          if (c.fim && agora - c.fim < 25000) {
            aviso = { texto: `Caçou ${Math.round((agora - c.fim) / 1000)} s depois da anterior: menos de 25 s aponta Demon.`, marcar: { id: 'c_cooldown', valor: 'sim' } };
          }
          const inc = e.t.incenso;
          if (inc.ini) {
            const s = decorrido(inc, agora) / 1000;
            if (s >= 55 && s < 90) aviso = { texto: `Caçou ${Math.round(s)} s após o incenso: aponta Demon.`, marcar: { id: 'c_incenso_60', valor: 'sim' } };
            inc.acum = decorrido(inc, agora); inc.ini = null;
          }
          c.ini = agora;
        } else {
          const dur = Math.round((agora - c.ini) / 1000);
          c.hist.push(dur); if (c.hist.length > 10) c.hist.shift();
          c.ini = null; c.fim = agora;
          const esp = cacadaEsperada(e.contrato);
          if (esp && dur >= 8 && dur < esp * 0.85) aviso = { texto: `Caçada de ${dur} s, bem menor que os ~${esp} s esperados: aponta Obambo (caçada curta).`, marcar: { id: 'c_curta', valor: 'sim' } };
        }
        break;
      }
      case 'toque': {
        if (e.toques.length && agora - e.toques[e.toques.length - 1] > 2000) e.toques = [];
        e.toques.push(agora); if (e.toques.length > 10) e.toques.shift();
        if (e.toques.length >= 3) {
          const iv = [];
          for (let k = 1; k < e.toques.length; k++) iv.push(e.toques[k] - e.toques[k - 1]);
          const bpm = 60000 / (iv.reduce((a, b) => a + b, 0) / iv.length);
          e.med = { bpm, v: Motor.bpmParaVelocidade(bpm) };
        }
        break;
      }
      case 'zerar': e.t = timersVazios(); e.toques = []; e.med = null; break;
      default: break;
    }
    return { estado: e, aviso };
  }

  /** Texto e cor de cada cronômetro num instante (para Dashboard e HUD). */
  function statusTimers(e, agora) {
    agora = agora || Date.now();
    const out = {};
    const inc = e.t.incenso; const sI = decorrido(inc, agora) / 1000;
    let st = 'pronto'; let cls = '';
    if (inc.ini || inc.acum) {
      if (sI < 60) st = `seguro por ${Math.ceil(60 - sI)} s`;
      else if (sI < 90) { st = 'só Demon pode caçar'; cls = 'alerta'; } else if (sI < 180) { st = `todos, menos Spirit (${Math.ceil(180 - sI)} s)`; cls = 'alerta'; } else { st = 'proteção acabou'; cls = 'perigo'; }
    }
    out.incenso = { ms: decorrido(inc, agora), st, cls, rodando: !!inc.ini, prog: Math.min(100, sI / 2) };

    const c = e.t.cacada; let ms = 0; st = 'aperte ao começar'; cls = ''; let perigo = false;
    const esp = cacadaEsperada(e.contrato);
    if (c.ini) { ms = agora - c.ini; st = esp ? `esperado ~${esp} s` : 'em andamento'; perigo = true; } else if (c.fim) {
      const d = (agora - c.fim) / 1000; ms = d * 1000;
      if (d < 25) { st = d < 20 ? `cooldown ${Math.ceil(25 - d)} s` : 'só Demon pode caçar'; cls = 'alerta'; } else st = c.hist.length ? `últimas: ${c.hist.slice(-3).join(' s, ')} s` : 'pronto';
    }
    out.cacada = { ms, st, cls, rodando: false, perigo };

    const k = e.t.contrato; const sC = decorrido(k, agora) / 1000;
    st = 'aperte ao abrir a porta';
    if (k.ini || k.acum) {
      if (sC < 60) st = `Mímico/Thaye/Obambo em ${Math.ceil(60 - sC)} s`;
      else { const f = Math.floor((sC - 60) / 120); st = `Obambo: ${f % 2 === 0 ? 'agressivo' : 'calmo'} (${Math.ceil(120 - ((sC - 60) % 120))} s)`; }
    }
    out.contrato = { ms: decorrido(k, agora), st, cls: '', rodando: !!k.ini };
    return out;
  }

  /** Fantasmas possíveis cuja velocidade sem visão bate com os passos medidos. */
  function fantasmasPelaVelocidade(e, resultado) {
    if (!e.med) return [];
    const mult = (e.contrato.vel || 100) / 100;
    return dados.FANTASMAS.filter((g) => !g.mimico && resultado[g.id] && resultado[g.id].possivel && Motor.velocidadeCompativel(g, e.med.v, { multiplicador: mult }) === 'base').map((g) => g.nome);
  }

  const fmtTempo = (ms) => { const s = Math.max(0, Math.floor(ms / 1000)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };

  const api = { ORDEM_EV, SINAIS, CONTRATO_PADRAO, estadoInicial, normalizar, nEvid, nomeDif, difDados, paraMotor, aplicar, statusTimers, cacadaEsperada, fantasmasPelaVelocidade, fmtTempo };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Estado = api;
})(typeof window !== 'undefined' ? window : globalThis);
