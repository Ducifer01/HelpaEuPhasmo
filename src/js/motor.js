/*
 * Motor de dedução: decide quais fantasmas ainda são possíveis.
 * Funções puras — testadas em tests/motor.test.js.
 */
(function (root) {
  const dados = (typeof module !== 'undefined' && module.exports)
    ? Object.assign({}, require('../data/evidencias.js'), require('../data/fantasmas.js'), require('../data/caracteristicas.js'))
    : root;

  const nomeEvid = (id) => (dados.EVIDENCIAS.find((e) => e.id === id) || { curto: id }).curto;

  /** Velocidade (m/s) a partir de passos por minuto. Passo = 1/v − 0,075 s. */
  function bpmParaVelocidade(bpm) {
    if (!bpm || bpm <= 0) return 0;
    return 1 / (60 / bpm + 0.075);
  }
  function velocidadeParaBpm(v) {
    if (!v || v <= 0) return 0;
    return 60 / (1 / v - 0.075);
  }

  /**
   * Compatibilidade de uma velocidade medida com um fantasma.
   * Retorna 'base' (bate com a velocidade sem visão), 'visao' (só se ele estava te vendo) ou null.
   */
  function velocidadeCompativel(g, v, opts) {
    const mult = (opts && opts.multiplicador) || 1;
    const tol = (opts && opts.tolerancia) || 0.12;
    const s = v / mult;
    if (g.mimico) return 'base';
    for (const [a, b] of g.vel.faixas) {
      if (s >= a - tol && s <= b + tol) return 'base';
    }
    const minBase = Math.min(...g.vel.faixas.map((f) => f[0]));
    if (g.vel.los && s >= minBase - tol && s <= g.vel.los + tol) return 'visao';
    return null;
  }

  /**
   * estado = {
   *   nEvid: 0..3,
   *   evid: { emf: 'sim'|'nao'|undefined, ... },
   *   marcadores: { id: 'sim'|'nao' },
   *   sanidadeCaca: número|null  (maior sanidade média em que ele já caçou, sem amaldiçoado)
   *   manual: { ghostId: true }  (descartados à mão)
   *   hostAbaixo30: bool
   * }
   * Retorna { [ghostId]: { possivel: bool, motivos: [string] } }
   */
  function avaliar(estado) {
    const N = estado.nEvid == null ? 3 : estado.nEvid;
    const evid = estado.evid || {};
    const marc = estado.marcadores || {};
    const confirmadas = Object.keys(evid).filter((k) => evid[k] === 'sim');
    const descartadas = Object.keys(evid).filter((k) => evid[k] === 'nao');
    const res = {};

    for (const g of dados.FANTASMAS) {
      const motivos = [];
      const reais = g.evid;

      // ── Evidências ──
      for (const e of confirmadas) {
        if (g.mimico && e === 'orb') continue;
        if (!reais.includes(e)) motivos.push(`Não tem ${nomeEvid(e)}`);
      }
      const confirmadasReais = confirmadas.filter((e) => reais.includes(e));
      if (confirmadasReais.length > N && motivos.length === 0) {
        motivos.push(N === 0
          ? 'Contrato sem evidências: só o Mímico mostra (orbes)'
          : `Mais evidências do que a dificuldade mostra (${N})`);
      }
      if (g.mimico && descartadas.includes('orb')) {
        motivos.push('O Mímico SEMPRE mostra orbes (até com 0 evidências)');
      }
      const descReais = descartadas.filter((e) => reais.includes(e));
      if (N >= 3) {
        for (const e of descReais) motivos.push(`Teria ${nomeEvid(e)}`);
      } else if (N > 0) {
        if (g.forcada && !g.mimico && descReais.includes(g.forcada)) {
          motivos.push(`${nomeEvid(g.forcada)} é evidência garantida dele`);
        }
        const disponiveis = reais.filter((e) => !descartadas.includes(e));
        if (disponiveis.length < N) {
          motivos.push(`Não sobram ${N} evidências possíveis`);
        }
        if (g.forcada && !g.mimico && confirmadasReais.length >= N && !confirmadasReais.includes(g.forcada)) {
          motivos.push(`Faltou ${nomeEvid(g.forcada)} (evidência garantida)`);
        }
      }

      // ── Opções do contrato ──
      if (estado.hostAbaixo30 && g.id === 'deogen') motivos.push('Host abaixo do nível 30 (Deogen não aparece)');

      // ── Comportamentos (o Mímico copia, então não é eliminado) ──
      if (!g.mimico) {
        for (const m of dados.CARACTERISTICAS) {
          const st = marc[m.id];
          if (!st) continue;
          const regra = st === 'sim' ? m.sim : m.nao;
          if (!regra) continue;
          const rotulo = st === 'sim' ? m.nome : (m.labelNao || `NÃO: ${m.nome}`);
          if (regra.apenas && !regra.apenas.includes(g.id)) motivos.push(rotulo);
          if (regra.exclui && regra.exclui.includes(g.id)) motivos.push(rotulo);
        }
        if (estado.sanidadeCaca != null && g.caca.max < estado.sanidadeCaca) {
          motivos.push(`Caçou com ${estado.sanidadeCaca}%+ (ele só caça até ${g.caca.max}%)`);
        }
      }

      if (estado.manual && estado.manual[g.id]) motivos.push('Descartado manualmente');

      res[g.id] = { possivel: motivos.length === 0, motivos };
    }
    return res;
  }

  /** Estado de cada evidência para a UI: pode/garantida/impossível considerando os fantasmas restantes. */
  function evidenciasRestantes(estado, resultado) {
    const vivos = dados.FANTASMAS.filter((g) => resultado[g.id].possivel);
    const out = {};
    for (const e of dados.EVIDENCIAS) {
      const quem = vivos.filter((g) => g.evid.includes(e.id) || (g.mimico && e.id === 'orb'));
      out[e.id] = { possivelEm: quem.length, total: vivos.length };
    }
    return out;
  }

  /**
   * Sugere próximos testes: características que dividem melhor os fantasmas restantes.
   * Ignora o Mímico no cálculo (ele nunca é eliminado por comportamento).
   */
  function sugerirTestes(estado, resultado, limite) {
    const vivos = dados.FANTASMAS.filter((g) => resultado[g.id].possivel && !g.mimico).map((g) => g.id);
    if (vivos.length <= 1) return [];
    const marc = estado.marcadores || {};
    const sugestoes = [];
    for (const m of dados.CARACTERISTICAS) {
      if (marc[m.id]) continue;
      const elimSim = contaEliminados(m.sim, vivos);
      const elimNao = contaEliminados(m.nao, vivos);
      // Melhor teste: o que mais divide (não elimina tudo nem nada)
      const util = (x) => (x > 0 && x < vivos.length ? Math.min(x, vivos.length - x) + 0.01 * x : 0);
      const score = Math.max(util(elimSim), util(elimNao));
      const envolvidos = vivos.filter((id) => envolve(m, id));
      if (score > 0 && envolvidos.length) sugestoes.push({ m, score, envolvidos });
    }
    sugestoes.sort((a, b) => b.score - a.score);
    return sugestoes.slice(0, limite || 6);
  }
  function contaEliminados(regra, vivos) {
    if (!regra) return 0;
    let n = 0;
    for (const id of vivos) {
      if ((regra.apenas && !regra.apenas.includes(id)) || (regra.exclui && regra.exclui.includes(id))) n++;
    }
    return n;
  }
  function envolve(m, id) {
    const l = [];
    for (const r of [m.sim, m.nao]) {
      if (!r) continue;
      if (r.apenas) l.push(...r.apenas);
      if (r.exclui) l.push(...r.exclui);
    }
    return l.includes(id);
  }

  /** Duração esperada da caçada (s) pela dificuldade e tamanho do mapa. */
  function duracaoEsperada(difId, mapa) {
    const d = dados.DIFICULDADES.find((x) => x.id === difId) || dados.DIFICULDADES[2];
    const idx = { pequeno: 0, medio: 1, grande: 2 }[mapa];
    return idx == null ? null : d.duracaoCaca[idx];
  }

  const api = { avaliar, evidenciasRestantes, sugerirTestes, bpmParaVelocidade, velocidadeParaBpm, velocidadeCompativel, duracaoEsperada };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Motor = api;
})(typeof window !== 'undefined' ? window : globalThis);
