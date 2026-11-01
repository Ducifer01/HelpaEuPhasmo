/* Evidências e dificuldades — Phasmophobia v0.19.x (dados conferidos em out/2026). */
(function (root) {
  const EVIDENCIAS = [
    { id: 'emf', nome: 'EMF Nível 5', curto: 'EMF 5', icone: '📶',
      dica: 'Leitor EMF marcando 5 ao fantasma interagir ou num evento. Interações comuns deixam EMF 2 a 4.' },
    { id: 'orb', nome: 'Orbe Fantasma', curto: 'Orbe', icone: '🔮',
      dica: 'Pontos de luz flutuando no cômodo, vistos só pela Câmera de Vídeo (ou Head Gear). O Mímico SEMPRE mostra orbes, até com 0 evidências.' },
    { id: 'box', nome: 'Spirit Box', curto: 'Spirit Box', icone: '📻',
      dica: 'Resposta de voz no Spirit Box com as luzes apagadas, perto do fantasma. Alguns só respondem a quem está sozinho.' },
    { id: 'freezing', nome: 'Temperatura Congelante', curto: 'Congelante', icone: '❄️',
      dica: 'Termômetro abaixo de 0 °C (32 °F) no cômodo do fantasma. Respiração visível também indica.' },
    { id: 'uv', nome: 'Ultravioleta (Digitais)', curto: 'UV', icone: '🖐️',
      dica: 'Digitais/mãos em portas, interruptores, janelas ou pegadas no sal vistas com lanterna UV ou Glowstick.' },
    { id: 'writing', nome: 'Escrita Fantasma', curto: 'Escrita', icone: '📖',
      dica: 'Livro de escrita colocado no cômodo é rabiscado. Coloque perto do ponto onde o fantasma fica.' },
    { id: 'dots', nome: 'Projetor D.O.T.S.', curto: 'D.O.T.S.', icone: '🟢',
      dica: 'Silhueta passando pelos pontos verdes do projetor. O Goryo só aparece pela câmera e com o cômodo vazio.' }
  ];

  /* Dificuldades oficiais + predefinições de desafio. Valores de caça: Pequeno/Médio/Grande. */
  const DIFICULDADES = [
    { id: 'amador', nome: 'Amador', evid: 3, sanidadeInicial: 100, remedio: 40, dreno: '1x', setup: '5:00', graca: 5,
      duracaoCaca: [15, 30, 40], amaldicoados: 'Normalmente 1',
      notas: ['Fantasma menos ativo.', 'Ótima para aprender os comportamentos.'] },
    { id: 'intermediario', nome: 'Intermediário', evid: 3, sanidadeInicial: 100, remedio: 35, dreno: '1,5x', setup: '2:00', graca: 4,
      duracaoCaca: [20, 40, 50], amaldicoados: 'Normalmente 1',
      notas: ['Atividade comum do fantasma.'] },
    { id: 'profissional', nome: 'Profissional', evid: 3, sanidadeInicial: 100, remedio: 30, dreno: '2x', setup: 'Nenhum', graca: 3,
      duracaoCaca: [30, 50, 60], amaldicoados: 'Normalmente 1',
      notas: ['Sem tempo de preparação: o fantasma pode caçar desde o início se a sanidade cair.'] },
    { id: 'pesadelo', nome: 'Pesadelo', evid: 2, sanidadeInicial: 100, remedio: 25, dreno: '2x', setup: 'Nenhum', graca: 2,
      duracaoCaca: [30, 50, 60], amaldicoados: 'Normalmente 1',
      notas: ['Só 2 das 3 evidências aparecem.', 'Fantasmas com evidência garantida sempre mostram ela.', 'Cômodo do fantasma oculto no mapa/menos esconderijos.'] },
    { id: 'insanidade', nome: 'Insanidade', evid: 1, sanidadeInicial: 75, remedio: 20, dreno: '2x', setup: 'Nenhum', graca: 2,
      duracaoCaca: [30, 50, 60], amaldicoados: 'Nenhum (padrão)',
      notas: ['Só 1 evidência aparece.', 'Começa com 75% de sanidade.', 'Fantasmas com evidência garantida mostram SÓ ela.'] },
    { id: 'apocalipse', nome: 'Apocalipse (desafio I/II/III)', evid: 0, sanidadeInicial: null, remedio: null, dreno: 'Alto', setup: 'Nenhum', graca: null,
      duracaoCaca: [30, 50, 60], amaldicoados: 'Variável',
      notas: ['Predefinições de dificuldade personalizada (0 evidências).', 'Apocalipse III: Sunny Meadows, solo, multiplicador 15x.', 'Só comportamento identifica o fantasma; orbes = Mímico.'] },
    { id: 'personalizada', nome: 'Personalizada', evid: null, sanidadeInicial: null, remedio: null, dreno: 'Ajustável', setup: 'Ajustável', graca: null,
      duracaoCaca: [30, 50, 60], amaldicoados: 'Ajustável',
      notas: ['Evidências de 0 a 3, velocidade do fantasma 50%–150%, graça 0–5 s, duração de caça, esconderijos, disjuntor, etc.', 'Desbloqueia em nível alto; também usada para treinar (ex.: fantasma amigável).'] }
  ];

  const MAPAS = {
    pequeno: { nome: 'Pequeno', exemplos: '6 Tanglewood, 10 Ridgeview, 13 Willow, 42 Edgefield, Grafton, Bleasdale, Camp Woodwind, Point Hope, Nell\'s Diner' },
    medio: { nome: 'Médio', exemplos: 'Maple Lodge Campsite, Prison, Sunny Meadows (Restrita)' },
    grande: { nome: 'Grande', exemplos: 'Sunny Meadows, Brownstone High School' }
  };

  const api = { EVIDENCIAS, DIFICULDADES, MAPAS };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else Object.assign(root, api);
})(typeof window !== 'undefined' ? window : globalThis);
