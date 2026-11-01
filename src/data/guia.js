/* Guia rápido: mecânicas, dicas de profissionais e itens amaldiçoados (v0.19.x). */
(function (root) {
  const GUIA = {
    mecanicas: [
      { titulo: 'Caçada', itens: [
        'Limite padrão: 50% de sanidade MÉDIA dos vivos (Banshee usa a sanidade do alvo).',
        'Cooldown mínimo entre caçadas: 25 s (Demon 20 s). Itens amaldiçoados ignoram.',
        'Período de graça no início: Amador 5 s · Intermediário 4 s · Profissional 3 s · Pesadelo/Insanidade 2 s · amaldiçoada 1 s · personalizada 0–5 s.',
        'Duração (sem a graça) — Pequeno/Médio/Grande: Baixa 15/30/40 s · Média 20/40/50 s · Alta 30/50/60 s (Amador = baixa, Intermediário = média, Profissional+ = alta).',
        'Depois que uma caçada amaldiçoada começa, todas as próximas duram +20 s.',
        'Velocidade padrão 1,7 m/s; com visão acelera até ~2,8 m/s em 13 s. Passos: ~117 por minuto a 1,7 m/s.'
      ] },
      { titulo: 'Detecção durante a caçada', itens: [
        'Visão de até ~75 m.',
        'Ouve voz (e chat global) a 9 m no mesmo andar; Yokai só a 2,5 m.',
        'Eletrônicos segurados/vestidos atraem a 7,5 m no mesmo andar. Eletrônicos no chão NÃO atraem.',
        'Interferência em eletrônicos e luzes a 10 m (Raiju 15 m).',
        'Passos e voz do fantasma audíveis a 20 m (Myling 12 m).',
        'Em outro andar o fantasma só te detecta por visão.'
      ] },
      { titulo: 'Incenso (defumação)', itens: [
        'Fora da caçada: impede caçadas por 90 s (Spirit 180 s, Demon 60 s).',
        'Na caçada: cega por 5 s (Moroi 7 s; Gallu 4/5/6 s conforme o estado) e faz ele vagar.',
        'Yurei: defumar no cômodo dele prende ele lá por 90 s.',
        'Não para caçada amaldiçoada, mas cega o fantasma nela.',
        'O temporizador não reinicia se reacender antes de acabar — espere expirar para testar Spirit/Demon.'
      ] },
      { titulo: 'Crucifixo', itens: [
        'Impede o INÍCIO da caçada dentro do alcance (não para caçada em andamento).',
        'Alcance aproximado: T1 3 m · T2 4 m · T3 5 m (Demon: 4,5 / 6 / 7,5 m).',
        'T1 impede 1 caçada; T2 e T3 impedem 2.',
        'Caçada amaldiçoada só é impedida por crucifixo T3 com 2 cargas.',
        'Onryo: chama acesa perto tem prioridade sobre o crucifixo.'
      ] },
      { titulo: 'Sanidade', itens: [
        'Solo: dreno passivo pela metade.',
        'Escuridão drena; luz do cômodo acesa para o dreno passivo (lanterna/TV não contam).',
        'No setup a sanidade não cai abaixo de 50% e o fantasma não caça naturalmente.',
        'Remédio restaura: Amador 40% · Intermediário 35% · Profissional 30% · Pesadelo 25% · Insanidade 20%.',
        'Drenos diretos: eventos, Jinn (25%), Yurei (15%), Poltergeist (2%/objeto), mortes, itens amaldiçoados, maldição do Moroi.'
      ] },
      { titulo: 'Evidência garantida (Pesadelo, Insanidade, personalizada 1–2)', itens: [
        'Goryo → D.O.T.S. · Hantu → Congelante · Obake → Ultravioleta · Deogen → Spirit Box · Moroi → Spirit Box.',
        'Mímico → orbes falsos sempre (são evidência extra; aparecem até com 0 evidências).',
        'Em Insanidade (1 evidência) esses fantasmas mostram SÓ a garantida.'
      ] }
    ],

    semEvidencia: [
      { titulo: 'Antes de tudo', itens: [
        'Configure o contrato como "sem evidências". O app passa a filtrar só por comportamento.',
        'Câmera de vídeo no cômodo desde o início: QUALQUER orbe = Mímico.',
        'Leve parabólico (Tier III se possível), incenso, crucifixos, sal, velas/isqueiro, câmera fotográfica e sensores de movimento.',
        'Ache o cômodo pela atividade: portas mexendo, sons no parabólico, luzes, temperatura (só não chega abaixo de 0 °C como evidência).'
      ] },
      { titulo: 'Testes que funcionam sem evidência', itens: [
        'Cronômetro de incenso: Demon caça após 60 s; Spirit só após 180 s.',
        'Cronômetro de caçada: cooldown < 25 s = Demon; caçada ~20% mais curta = Obambo.',
        'Toque de passos em toda caçada: Revenant ~1 m/s procurando; Deildegast ~3 m/s no início; Hantu muda com a temperatura; Thaye fica mais lento a cada caçada; Twins alterna 1,5/1,9; Aswang 1,53 constante.',
        'Sal em todas as passagens: sem pegadas = Wraith (ou Gallu enfurecido). Pisou só no 1º = Gallu.',
        'Disjuntor desligado + observar a caçada: respiração gelada = Hantu. Fantasma ligou o disjuntor = não é Hantu.',
        'Foto em todo evento: sumiu = Phantom. Piscada muito lenta na caçada = Phantom; quase sempre visível = Oni/Deogen.',
        'Parabólico: grito = Banshee; dois sons com < 80 s = Myling.',
        'Velas acesas: apagou rápido = Onryo. Vela em cima do crucifixo: crucifixo queimou = não é Onryo.',
        'Luz acesa apagada logo depois = Mare. Fantasma acendeu luz = não é Mare.',
        'Fique no cômodo: nada acontece e não caça = Shade.',
        'Pilha de objetos: voaram juntos = Poltergeist.',
        'Fique parado na caçada (com incenso): não te acha parado mas te acha andando = Kormos. Lenta quando você para e rápida quando anda = Dayan.',
        'Deogen: vem direto até você e anda lentíssimo perto — dê voltas em móveis.',
        'Mova 15 objetos diferentes antes da caçada: ficou bem mais lento = Deildegast.'
      ] },
      { titulo: 'Dicas de profissionais', itens: [
        'Na primeira caçada, jogue um crucifixo na frente do esconderijo e escute 1–3 caçadas com o parabólico antes de se arriscar.',
        'Quem "persegue" você (Banshee no seu andar, Phantom, Wraith) dá para notar de um ponto seguro.',
        'Revenant é o lento; Deogen é o que vem direto em você; Thaye/Hantu/Moroi fazem passos anormalmente rápidos que não vão direto até você.',
        'Myling: sem parabólico você não ouve ele chegando.',
        'Jinn, Mare, Goryo, Shade e Yurei são os mais difíceis sem evidência: se o objetivo for XP, às vezes vale recomeçar.',
        'Mova itens em etapas e volte ao caminhão depois de cada caçada.',
        'Se morrer antes de identificar, fique no jogo para ver o fantasma (a não ser que esteja sem dinheiro).',
        'Dois minutos de paciência valem mais que uma morte: espere o incenso expirar antes de testar de novo.'
      ] }
    ],

    amaldicoados: [
      'Tabuleiro Ouija: responde perguntas em troca de sanidade. Diga "Goodbye" antes de sair; tabuleiro quebrado = caçada amaldiçoada.',
      'Espelho Assombrado: mostra o cômodo do fantasma; custa no mínimo 20% (7,5%/s).',
      'Caixa de Música: perto do fantasma ele canta e vem até a caixa; drena sanidade.',
      'Círculo de Invocação: 16% por vela; as 5 velas invocam o fantasma e iniciam caçada amaldiçoada.',
      'Boneca Vodu: alfinete normal 5%; alfinete do coração 10% + caçada amaldiçoada.',
      'Cartas de Tarô: Sol restaura 100%, Lua zera a sanidade, Morte inicia caçada amaldiçoada, Eremita prende o fantasma no cômodo, Diabo força evento.',
      'Pata de Macaco: desejos com consequências (ex.: "quero ser são" deixa em 50% mas acelera o dreno).',
      'Usar qualquer item amaldiçoado encerra o setup. Caçadas amaldiçoadas têm 1 s de graça e ignoram limite de sanidade e cooldown.'
    ],

    fontes: [
      { nome: 'Notas de atualização oficiais (Kinetic Games)', url: 'https://kineticgames.co.uk/news' },
      { nome: 'Phasmophobia Wiki (Fandom)', url: 'https://phasmophobia.fandom.com/wiki/Ghost' },
      { nome: 'Phasmopedia (dados verificados na v0.19.0.2)', url: 'https://phasmopedia.com/en/' },
      { nome: 'Steam — anúncios do Phasmophobia', url: 'https://steamcommunity.com/app/739630/announcements/' }
    ]
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = { GUIA };
  else root.GUIA = GUIA;
})(typeof window !== 'undefined' ? window : globalThis);
