const test = require('node:test');
const assert = require('node:assert');
const Motor = require('../src/js/motor.js');
const { FANTASMAS } = require('../src/data/fantasmas.js');
const { CARACTERISTICAS } = require('../src/data/caracteristicas.js');
const { EVIDENCIAS } = require('../src/data/evidencias.js');

const vivos = (estado) => {
  const r = Motor.avaliar(estado);
  return Object.keys(r).filter((k) => r[k].possivel).sort();
};

test('30 fantasmas, ids únicos e evidências válidas', () => {
  assert.strictEqual(FANTASMAS.length, 30);
  const ids = new Set(FANTASMAS.map((g) => g.id));
  assert.strictEqual(ids.size, 30);
  const ev = new Set(EVIDENCIAS.map((e) => e.id));
  for (const g of FANTASMAS) {
    assert.strictEqual(g.evid.length, 3, g.id);
    for (const e of g.evid) assert.ok(ev.has(e), `${g.id}: ${e}`);
    if (g.forcada && !g.mimico) assert.ok(g.evid.includes(g.forcada), g.id);
  }
});

test('nenhum par de fantasmas tem as mesmas 3 evidências (exceto Mímico pelos orbes)', () => {
  const vistos = new Map();
  for (const g of FANTASMAS) {
    const k = [...g.evid].sort().join('+');
    assert.ok(!vistos.has(k), `${g.id} e ${vistos.get(k)} iguais`);
    vistos.set(k, g.id);
  }
});

test('características só citam fantasmas que existem', () => {
  const ids = new Set(FANTASMAS.map((g) => g.id));
  for (const m of CARACTERISTICAS) {
    for (const r of [m.sim, m.nao]) {
      if (!r) continue;
      for (const id of [...(r.apenas || []), ...(r.exclui || [])]) assert.ok(ids.has(id), `${m.id}: ${id}`);
    }
  }
});

test('3 evidências identificam um único fantasma', () => {
  for (const g of FANTASMAS) {
    if (g.mimico) continue;
    const evid = {};
    g.evid.forEach((e) => (evid[e] = 'sim'));
    const esperado = ['hantu', 'kormos', 'onryo'].includes(g.id) ? [g.id, 'mimic'].sort() : [g.id];
    assert.deepStrictEqual(vivos({ nEvid: 3, evid }), esperado);
  }
});

test('Hantu/Kormos/Onryo x Mímico: falta de Spirit Box/Congelante/UV separa', () => {
  assert.deepStrictEqual(vivos({ nEvid: 3, evid: { orb: 'sim', uv: 'sim', freezing: 'sim', box: 'nao' } }), ['hantu']);
});

test('Mímico: 0 evidências + orbe = só o Mímico', () => {
  assert.deepStrictEqual(vivos({ nEvid: 0, evid: { orb: 'sim' } }), ['mimic']);
});

test('Mímico: orbe descartado elimina o Mímico', () => {
  assert.ok(!vivos({ nEvid: 0, evid: { orb: 'nao' } }).includes('mimic'));
});

test('Mímico: Pesadelo com 3 evidências incluindo orbe', () => {
  assert.deepStrictEqual(vivos({ nEvid: 2, evid: { orb: 'sim', box: 'sim', uv: 'sim' } }), ['mimic']);
});

test('0 evidências: sem marcações todos são possíveis', () => {
  assert.strictEqual(vivos({ nEvid: 0, evid: {} }).length, 30);
});

test('Insanidade (1 evidência): EMF achado descarta Goryo (D.O.T.S. garantido)', () => {
  const v = vivos({ nEvid: 1, evid: { emf: 'sim' } });
  assert.ok(!v.includes('goryo'));
  assert.ok(v.includes('spirit'));
});

test('Pesadelo: descartar Congelante elimina Hantu mas não Demon', () => {
  const v = vivos({ nEvid: 2, evid: { freezing: 'nao' } });
  assert.ok(!v.includes('hantu'));
  assert.ok(v.includes('demon'));
});

test('Profissional: evidência descartada elimina', () => {
  const v = vivos({ nEvid: 3, evid: { freezing: 'nao' } });
  assert.ok(!v.includes('demon'));
});

test('Pesadelo: descartar 2 evidências de um fantasma elimina ele', () => {
  const v = vivos({ nEvid: 2, evid: { emf: 'nao', box: 'nao' } });
  assert.ok(!v.includes('spirit'));
  assert.ok(v.includes('demon'));
});

test('"Fantasma rápido" deixa só os que ficam rápidos (+ Mímico)', () => {
  const v = vivos({ nEvid: 0, evid: {}, marcadores: { v_muito_rapido: 'sim' } });
  assert.ok(v.includes('revenant') && v.includes('hantu') && v.includes('deildegast') && v.includes('mimic'));
  assert.ok(!v.includes('spirit') && !v.includes('banshee'));
});

test('Pisou no sal descarta Wraith; Mímico continua', () => {
  const v = vivos({ nEvid: 3, evid: {}, marcadores: { i_sal_pisou: 'sim' } });
  assert.ok(!v.includes('wraith'));
  assert.ok(v.includes('mimic'));
});

test('Sanidade da caçada: 70% elimina fantasmas padrão', () => {
  const v = vivos({ nEvid: 3, evid: {}, sanidadeCaca: 70 });
  assert.ok(v.includes('demon') && v.includes('yokai') && v.includes('thaye') && v.includes('kormos'));
  assert.ok(!v.includes('spirit') && !v.includes('raiju'));
});

test('Host abaixo do nível 30 descarta Deogen', () => {
  assert.ok(!vivos({ nEvid: 3, hostAbaixo30: true }).includes('deogen'));
});

test('BPM ↔ velocidade', () => {
  assert.ok(Math.abs(Motor.velocidadeParaBpm(1.7) - 117) < 1);
  assert.ok(Math.abs(Motor.bpmParaVelocidade(232) - 3.0) < 0.02);
  assert.ok(Math.abs(Motor.bpmParaVelocidade(65) - 1.0) < 0.02);
});

test('velocidade compatível', () => {
  const g = (id) => FANTASMAS.find((x) => x.id === id);
  assert.strictEqual(Motor.velocidadeCompativel(g('revenant'), 1.0), 'base');
  assert.strictEqual(Motor.velocidadeCompativel(g('spirit'), 1.0), null);
  assert.strictEqual(Motor.velocidadeCompativel(g('spirit'), 2.4), 'visao');
  assert.strictEqual(Motor.velocidadeCompativel(g('hantu'), 2.4), 'base');
  assert.strictEqual(Motor.velocidadeCompativel(g('spirit'), 1.7 * 1.5, { multiplicador: 1.5 }), 'base');
});

test('sugestões de teste aparecem com vários fantasmas restantes', () => {
  const estado = { nEvid: 3, evid: { emf: 'sim', box: 'sim' } };
  const r = Motor.avaliar(estado);
  const s = Motor.sugerirTestes(estado, r, 5);
  assert.ok(s.length > 0);
});

test('duração esperada da caçada', () => {
  assert.strictEqual(Motor.duracaoEsperada('amador', 'pequeno'), 15);
  assert.strictEqual(Motor.duracaoEsperada('profissional', 'grande'), 60);
  assert.strictEqual(Motor.duracaoEsperada('profissional', null), null);
});
