const test = require('node:test');
const assert = require('node:assert/strict');
const Estado = require('../src/js/estado.js');
const Motor = require('../src/js/motor.js');

const T = 1_700_000_000_000; // instante base (ms)
const aplicar = (e, a, t) => Estado.aplicar(e, a, t == null ? undefined : T + t).estado;
const possiveis = (e) => { const r = Motor.avaliar(Estado.paraMotor(e)); return Object.keys(r).filter((k) => r[k].possivel); };

test('evidência cicla encontrada → descartada → limpa', () => {
  let e = Estado.estadoInicial();
  e = aplicar(e, { tipo: 'evid', id: 'emf' }); assert.equal(e.evid.emf, 'sim');
  e = aplicar(e, { tipo: 'evid', id: 'emf' }); assert.equal(e.evid.emf, 'nao');
  e = aplicar(e, { tipo: 'evid', id: 'emf' }); assert.equal(e.evid.emf, undefined);
  e = aplicar(e, { tipo: 'evid', id: 'uv', descartar: true }); assert.equal(e.evid.uv, 'nao');
});

test('atalho de evidência segue a ordem da tela (1 = EMF, 2 = Spirit Box)', () => {
  let e = Estado.estadoInicial();
  e = aplicar(e, { tipo: 'evidAtalho', n: 2 });
  assert.deepEqual(e.evid, { box: 'sim' });
});

test('sem evidência: atalhos viram sinais únicos e o orbe aponta o Mímico', () => {
  let e = aplicar(Estado.estadoInicial(), { tipo: 'contrato', contrato: { dif: 'semevid', mapa: 'medio' } });
  assert.equal(Estado.nEvid(e.contrato), 0);
  e = aplicar(e, { tipo: 'evidAtalho', n: 1 }); // Orbe
  assert.deepEqual(possiveis(e), ['mimic']);
  e = aplicar(e, { tipo: 'evidAtalho', n: 1 }); // não viu orbe → descarta Mímico
  assert.ok(!possiveis(e).includes('mimic'));
  e = aplicar(e, { tipo: 'evidAtalho', n: 3 }); // Apagou a luz → Mare
  assert.deepEqual(possiveis(e), ['mare']);
  e = aplicar(e, { tipo: 'limparEvid' });
  assert.deepEqual(e.evid, {}); assert.equal(e.marc.i_luz_apagou, undefined);
});

test('todos os sinais únicos existem nas características', () => {
  const { CARACTERISTICAS } = require('../src/data/caracteristicas.js');
  for (const s of Estado.SINAIS) if (!s.ev) assert.ok(CARACTERISTICAS.find((m) => m.id === s.id), s.id);
});

test('novo contrato zera a partida e guarda o anterior', () => {
  let e = aplicar(Estado.estadoInicial(), { tipo: 'contrato', contrato: { dif: 'pesadelo', mapa: 'pequeno' } });
  e = aplicar(e, { tipo: 'evid', id: 'emf' });
  e = aplicar(e, { tipo: 'timer', id: 'incenso' }, 1000);
  e = aplicar(e, { tipo: 'contrato', contrato: { dif: 'insanidade', mapa: 'grande' } });
  assert.deepEqual(e.evid, {});
  assert.equal(e.t.incenso.ini, null);
  assert.equal(e.ultimo.dif, 'pesadelo');
  assert.equal(Estado.nEvid(e.contrato), 1);
});

test('caçada logo após a anterior sugere Demon', () => {
  let e = Estado.estadoInicial();
  e = aplicar(e, { tipo: 'cacada' }, 0);
  e = aplicar(e, { tipo: 'cacada' }, 40000);
  const r = Estado.aplicar(e, { tipo: 'cacada' }, T + 55000);
  assert.equal(r.aviso.marcar.id, 'c_cooldown');
  assert.deepEqual(r.estado.t.cacada.hist, [40]);
});

test('caçada 70 s após o incenso sugere Demon e para o incenso', () => {
  let e = aplicar(Estado.estadoInicial(), { tipo: 'timer', id: 'incenso' }, 0);
  const r = Estado.aplicar(e, { tipo: 'cacada' }, T + 70000);
  assert.equal(r.aviso.marcar.id, 'c_incenso_60');
  assert.equal(r.estado.t.incenso.ini, null);
  assert.equal(r.estado.t.incenso.acum, 70000);
});

test('caçada bem mais curta que o esperado sugere Obambo', () => {
  let e = aplicar(Estado.estadoInicial(), { tipo: 'contrato', contrato: { dif: 'profissional', mapa: 'medio' } }); // ~40 + 3 s
  e = aplicar(e, { tipo: 'cacada' }, 0);
  const r = Estado.aplicar(e, { tipo: 'cacada' }, T + 25000);
  assert.equal(r.aviso.marcar.id, 'c_curta');
});

test('toques de passos calculam a velocidade (117/min ≈ 1,7 m/s)', () => {
  let e = Estado.estadoInicial();
  const iv = 60000 / 117;
  for (let i = 0; i < 6; i++) e = aplicar(e, { tipo: 'toque' }, 10000 + i * iv);
  assert.ok(Math.abs(e.med.v - 1.7) < 0.02, e.med.v);
  e = aplicar(e, { tipo: 'toque' }, 10000 + 6 * iv + 5000); // pausa longa recomeça
  assert.equal(e.toques.length, 1);
});

test('status do incenso muda nas marcas de 60, 90 e 180 s', () => {
  const e = aplicar(Estado.estadoInicial(), { tipo: 'timer', id: 'incenso' }, 0);
  assert.match(Estado.statusTimers(e, T + 30000).incenso.st, /seguro/);
  assert.match(Estado.statusTimers(e, T + 70000).incenso.st, /Demon/);
  assert.match(Estado.statusTimers(e, T + 120000).incenso.st, /Spirit/);
  assert.match(Estado.statusTimers(e, T + 190000).incenso.st, /acabou/);
});

test('normalizar aceita arquivo vazio ou antigo', () => {
  assert.equal(Estado.normalizar(null).contrato.dif, 'profissional');
  const n = Estado.normalizar({ evid: { emf: 'sim' }, t: { incenso: { ini: 5, acum: 0 } } });
  assert.equal(n.evid.emf, 'sim');
  assert.deepEqual(n.t.cacada.hist, []);
});
