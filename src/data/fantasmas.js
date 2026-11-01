/*
 * Banco de dados dos 30 fantasmas — Phasmophobia v0.19.x (out/2026).
 * Fontes: Phasmophobia Wiki (Fandom), Phasmopedia (dados verificados na v0.19.0.2),
 * notas de atualização oficiais da Kinetic Games e guias da comunidade.
 *
 * Campos:
 *  evid      -> evidências reais (o Mímico mostra orbes EXTRAS além das dele)
 *  forcada   -> evidência garantida em Pesadelo/Insanidade (e em personalizada com 1–2 evidências)
 *  caca.max  -> maior sanidade média (%) em que ele consegue caçar normalmente
 *  vel.faixas-> velocidades base (m/s) SEM visão do jogador. [min, max]
 *  vel.los   -> velocidade máxima com visão (line of sight). null = não acelera ao te ver
 */
(function (root) {
  const P = 1.7; // velocidade padrão
  const FANTASMAS = [
    {
      id: 'spirit', nome: 'Spirit', nomePt: 'Espírito',
      evid: ['emf', 'box', 'writing'], forcada: null,
      caca: { texto: '50%', max: 50 },
      vel: { texto: '1,7 m/s → até 2,8 m/s ao te ver', faixas: [[P, P]], los: 2.8 },
      resumo: 'O fantasma "base". A única marca registrada é o incenso durar muito mais.',
      forca: 'Nenhuma.',
      fraqueza: 'Incenso impede caçadas por 180 s (o normal é 90 s).',
      habilidades: ['Após ser defumado (incenso), não pode iniciar caçada por 180 s.'],
      sinais: ['Ficou mais de 90 s sem caçar com sanidade baixa logo depois do incenso.'],
      testes: [
        { nivel: 'conclusivo', titulo: 'Teste do incenso (180 s)', texto: 'Deixe a sanidade média abaixo de 50%. Acenda o incenso perto do fantasma e inicie o cronômetro de incenso. Se ele caçar antes de 180 s, NÃO é Spirit. Se passar de 180 s sem caçar (mesmo com sanidade baixíssima) é muito provável que seja.' }
      ],
      semEvidencia: ['Única forma prática: teste do incenso com sanidade bem baixa. Fique perto do cômodo para garantir que ele teria motivo para caçar.'],
      confundido: ['Demon (incenso de 60 s) — use o mesmo cronômetro.'],
      descartadoPor: ['Caçar entre 90 s e 180 s após um incenso bem-sucedido.'],
      sobrevivencia: ['Um incenso protege por 3 minutos inteiros: aproveite para coletar objetivos.']
    },
    {
      id: 'wraith', nome: 'Wraith', nomePt: 'Espectro',
      evid: ['emf', 'box', 'dots'], forcada: null,
      caca: { texto: '50%', max: 50 },
      vel: { texto: '1,7 m/s → 2,8 m/s ao te ver', faixas: [[P, P]], los: 2.8 },
      resumo: 'Nunca pisa no sal e às vezes se teleporta até um jogador.',
      forca: 'Pode se teleportar até um jogador aleatório (fora de caçada).',
      fraqueza: 'Não tem.',
      habilidades: [
        'Teleporta até um jogador e deixa EMF 2 (ou EMF 5 ~1/3 das vezes) na altura dos pés.',
        'Nunca pisa no sal, nem no sal Tier III.',
        'Pode começar uma caçada a partir do ponto para onde teleportou.'
      ],
      sinais: ['EMF aparecendo do nada longe do cômodo, perto de um jogador, na altura do chão.', 'Sensor de movimento dispara mas o sal na passagem continua intacto.'],
      testes: [
        { nivel: 'conclusivo', titulo: 'Sal no caminho', texto: 'Coloque sal em portas/corredores que ele usa (ou na frente do esconderijo durante a caçada). Se ele passar sem deixar pegadas = Wraith (ou Gallu enfurecido). Se pisou no sal = NÃO é Wraith.' },
        { nivel: 'forte', titulo: 'EMF fora do cômodo', texto: 'Leitura EMF 2/5 no chão perto de um jogador, longe do cômodo favorito, sem interação visível.' }
      ],
      semEvidencia: ['Encha de sal os corredores ao redor do cômodo e use sensores de movimento. Sensor disparando + sal intacto repetidas vezes aponta Wraith.', 'Pegada UV no sal descarta Wraith imediatamente.'],
      confundido: ['Gallu enfurecido também não pisa no sal.', 'Phantom deixa EMF 2 na altura da cabeça, nunca EMF 5.', 'Banshee anda até o alvo sem deixar EMF.'],
      descartadoPor: ['Pisar no sal (pegadas ou som de sal sendo pisado).'],
      sobrevivencia: ['Com sanidade baixa ele pode começar a caçada em qualquer lugar do mapa — tenha esconderijo sempre por perto.']
    },
    {
      id: 'phantom', nome: 'Phantom', nomePt: 'Fantasma',
      evid: ['box', 'uv', 'dots'], forcada: null,
      caca: { texto: '50%', max: 50 },
      vel: { texto: '1,7 m/s → 2,8 m/s ao te ver', faixas: [[P, P]], los: 2.8 },
      resumo: 'Some quando fotografado e fica quase invisível durante caçadas.',
      forca: 'Olhar para ele drena sanidade mais rápido.',
      fraqueza: 'Tirar foto dele faz ele desaparecer temporariamente.',
      habilidades: [
        'Foto/vídeo dele em evento ou no D.O.T.S. faz ele sumir; a foto sai sem fantasma e sem interferência.',
        'Visível só ~12–14% do tempo na caçada (normal ~31–33%), com intervalos invisíveis acima de 1 s.',
        'Às vezes vai até um jogador e deixa EMF 2 na altura da cabeça.'
      ],
      sinais: ['Pisca devagar na caçada — some por mais de 1 s entre piscadas.', 'Atividade em cômodos longe do favorito.'],
      testes: [
        { nivel: 'forte', titulo: 'Foto no evento', texto: 'Durante um evento fantasma ou silhueta no D.O.T.S., tire uma foto. Se ele sumir e a foto não mostrar o fantasma = Phantom. Se a foto mostrar o fantasma normalmente = NÃO é Phantom.' },
        { nivel: 'forte', titulo: 'Piscada lenta', texto: 'Numa caçada, observe de longe (ou pela câmera): se ele fica invisível por mais de 1 s entre as piscadas, é Phantom.' }
      ],
      semEvidencia: ['Observe a caçada de um local seguro com visão longa (corredor). Piscadas muito espaçadas = Phantom.', 'Tenha a câmera fotográfica em mãos em todo evento: se ele sumir com a foto, confirmado.'],
      confundido: ['Wraith (EMF no chão, Phantom é na cabeça).', 'Poltergeist também deixa EMF 2 na cabeça — descarte pelo arremesso de vários objetos.'],
      descartadoPor: ['Foto em evento/D.O.T.S. que mostra o fantasma.'],
      sobrevivencia: ['É difícil ver ele vindo: confie mais nos passos e no som do que nos olhos.']
    },
    {
      id: 'poltergeist', nome: 'Poltergeist',
      evid: ['box', 'uv', 'writing'], forcada: null,
      caca: { texto: '50%', max: 50 },
      vel: { texto: '1,7 m/s → 2,8 m/s ao te ver', faixas: [[P, P]], los: 2.8 },
      resumo: 'Arremessa vários objetos ao mesmo tempo ("explosão").',
      forca: 'Pode arremessar vários objetos de uma vez com força.',
      fraqueza: 'Fica quase inútil em cômodo vazio (sem objetos).',
      habilidades: [
        'Explosão de objetos: joga todos os itens próximos ao mesmo tempo; quem vê perde 2% de sanidade por objeto.',
        'Arremessa objetos mais longe e com mais frequência durante caçadas.'
      ],
      sinais: ['Vários objetos voando ao mesmo tempo.', 'Muitos itens fora do lugar no cômodo favorito.'],
      testes: [
        { nivel: 'conclusivo', titulo: 'Pilha de objetos', texto: 'Junte vários objetos arremessáveis numa pilha no cômodo dele (ou use os que já estão lá). Fique perto/observe pela câmera. Se todos voarem ao mesmo tempo = Poltergeist.' },
        { nivel: 'dica', titulo: 'Sanidade cai ao ver arremessos', texto: 'Monitor de sanidade caindo ~2% por objeto lançado na sua frente.' }
      ],
      semEvidencia: ['Pilha de objetos no cômodo + câmera apontada. Fique por perto (atividade aumenta).', 'Durante caçadas ele joga muitos objetos — escute barulho constante de itens.'],
      confundido: ['Oni e Deildegast também interagem muito com objetos.'],
      descartadoPor: ['Não há descarte definitivo; a explosão de objetos é a prova.'],
      sobrevivencia: ['Remova objetos do cômodo para diminuir o dreno de sanidade.']
    },
    {
      id: 'banshee', nome: 'Banshee', genero: 'f',
      evid: ['orb', 'uv', 'dots'], forcada: null,
      caca: { texto: '50% — da sanidade do ALVO, não da média', curto: '50% (do alvo)', max: 100 },
      vel: { texto: '1,7 m/s → 2,8 m/s ao te ver', faixas: [[P, P]], los: 2.8 },
      resumo: 'Escolhe um alvo e persegue só ele. Grita no microfone parabólico.',
      forca: 'Foca em um único jogador por vez.',
      fraqueza: 'Grito único no Microfone Parabólico/Gravador.',
      habilidades: [
        'Escolhe um alvo; na caçada ignora os outros e atravessa eles sem matar.',
        'Caça com base na sanidade do alvo: pode caçar com média de 87% ou não caçar com média de 12%.',
        'Canta em ~47% dos eventos (outros ~20%). Tocar nela no evento de canto drena 15%.',
        '~1 em 3 sons paranormais no parabólico é um grito de Banshee.',
        'Sempre feminina.'
      ],
      sinais: ['Vai repetidamente até um jogador específico sem deixar EMF.', 'Muitos eventos de canto (cantarolando).'],
      testes: [
        { nivel: 'conclusivo', titulo: 'Grito no parabólico', texto: 'Use o Microfone Parabólico (ou Gravador de Som) perto do cômodo. Um grito agudo característico = Banshee (ou Mímico copiando).' },
        { nivel: 'forte', titulo: 'Isca (alto risco)', texto: 'Com incenso pronto, jogadores se revezam sendo vistos na caçada. Se ele ignora todos menos um = Banshee.' },
        { nivel: 'dica', titulo: 'Sanidade desigual', texto: 'Caçou com a média alta enquanto um jogador estava abaixo de 50%? Ou não caça com a média baixa porque o alvo está com sanidade alta?' }
      ],
      semEvidencia: ['Parabólico Tier III no corredor do cômodo — gritos são a melhor prova.', 'Solo: muitos eventos de canto e aproximações frequentes até você.'],
      confundido: ['Yokai (orbe + D.O.T.S.) persegue qualquer um que vê.', 'Mímico: grito + resposta no Spirit Box = Mímico.'],
      descartadoPor: ['Nome/voz/modelo masculino.', 'Matar alguém que não era o alvo estando o alvo dentro da casa.'],
      sobrevivencia: ['Se você não é o alvo, pode ajudar a distrair; se é o alvo, mantenha a sanidade alta.']
    },
    {
      id: 'jinn', nome: 'Jinn', nomePt: 'Djinn',
      evid: ['emf', 'uv', 'freezing'], forcada: null,
      caca: { texto: '50%', max: 50 },
      vel: { texto: '1,7 m/s; fixo 2,5 m/s ao te ver a mais de 3 m com disjuntor LIGADO', faixas: [[P, P]], los: 2.8 },
      resumo: 'Rápido de longe se o disjuntor estiver ligado; nunca desliga o disjuntor.',
      forca: 'Viaja mais rápido até a vítima se ela estiver longe (disjuntor ligado).',
      fraqueza: 'Desligar o disjuntor tira o poder dele.',
      habilidades: [
        'Com disjuntor ligado, ao ver o alvo a mais de 3 m vai a 2,5 m/s fixos.',
        'Habilidade: drena 25% de sanidade de quem estiver no cômodo/3 m e deixa EMF 2/5 no disjuntor.',
        'Nunca desliga o disjuntor diretamente (só por sobrecarga de luzes).'
      ],
      sinais: ['EMF no disjuntor sem ele desligar.', 'Queda repentina de 25% de sanidade.', 'Disparada súbita quando te vê de longe no corredor.'],
      testes: [
        { nivel: 'forte', titulo: 'Disparada no corredor', texto: 'Disjuntor ligado. Fique no fim de um corredor longo com visão do fantasma. Se ele dispara para 2,5 m/s de cara (sem aceleração gradual) = Jinn.' },
        { nivel: 'forte', titulo: 'EMF no disjuntor', texto: 'Deixe um leitor EMF no disjuntor. Leitura sem o disjuntor desligar ou queda de 25% de sanidade = Jinn.' },
        { nivel: 'conclusivo', titulo: 'Disjuntor desligado pelo fantasma', texto: 'Se o FANTASMA desligou o disjuntor (os interruptores continuam como estavam), NÃO é Jinn. Sobrecarga (todas as luzes caem) não conta.' }
      ],
      semEvidencia: ['Muito difícil. Deixe o disjuntor ligado, leitor EMF nele e observe a velocidade com visão longa.', 'Se o disjuntor estiver quebrado (personalizada/Pata de Macaco), quase impossível provar.'],
      confundido: ['Revenant (lento até te detectar).', 'Hantu (não acelera ao te ver).'],
      descartadoPor: ['Fantasma desligar o disjuntor.'],
      sobrevivencia: ['Desligue o disjuntor para cortar a velocidade extra.']
    },
    {
      id: 'mare', nome: 'Mare', nomePt: 'Pesadelo',
      evid: ['orb', 'box', 'writing'], forcada: null,
      caca: { texto: '60% no escuro / 40% com luz acesa', curto: '60% / 40%', max: 60 },
      vel: { texto: '1,7 m/s → 2,8 m/s ao te ver', faixas: [[P, P]], los: 2.8 },
      resumo: 'Odeia luz: apaga luzes logo depois de você acender e nunca acende.',
      forca: 'Mais perigosa no escuro.',
      fraqueza: 'Luz acesa no cômodo dela reduz a chance de caçar.',
      habilidades: [
        'Caça a partir de 60% no escuro, 40% com a luz do cômodo acesa.',
        'Pode apagar a luz imediatamente após um jogador acender.',
        'Nunca acende luzes; prefere estourar lâmpadas e circular por cômodos escuros.'
      ],
      sinais: ['Luz apagando 1–2 s depois de você acender, repetidamente.', 'Lâmpadas estourando com frequência.'],
      testes: [
        { nivel: 'conclusivo', titulo: 'Acendeu uma luz?', texto: 'Se o fantasma ACENDER qualquer luz/interruptor, NÃO é Mare.' },
        { nivel: 'forte', titulo: 'Liga-desliga', texto: 'Acenda a luz do cômodo e saia de perto. Se apagar quase imediatamente, várias vezes = Mare.' },
        { nivel: 'dica', titulo: 'Caça em 60%', texto: 'Caçou entre 50% e 60% com o cômodo escuro.' }
      ],
      semEvidencia: ['Mantenha a luz do cômodo acesa e observe: apagar logo em seguida é sinal forte.', 'Qualquer luz acesa pelo fantasma descarta Mare.'],
      confundido: ['Demon/Yokai (caçam cedo também).'],
      descartadoPor: ['Fantasma acender uma luz.'],
      sobrevivencia: ['Mantenha luzes acesas onde você estiver.']
    },
    {
      id: 'revenant', nome: 'Revenant',
      evid: ['orb', 'writing', 'freezing'], forcada: null,
      caca: { texto: '50%', max: 50 },
      vel: { texto: '1,0 m/s procurando → 3,0 m/s ao te detectar (salto instantâneo)', faixas: [[1.0, 1.0], [3.0, 3.0]], los: null },
      resumo: 'Muito lento procurando, extremamente rápido quando te detecta.',
      forca: 'Corre muito ao detectar alguém.',
      fraqueza: 'Esconder-se faz ele andar devagar.',
      habilidades: [
        '1,0 m/s sem alvo; salta para 3,0 m/s ao detectar por visão, voz ou eletrônico.',
        'Ao perder o alvo, desacelera em ~2,7 s até 1,0 m/s.'
      ],
      sinais: ['Passos muito espaçados e lentos durante a caçada.', 'Salto brusco de velocidade (não gradual).'],
      testes: [
        { nivel: 'forte', titulo: 'Passos lentos', texto: 'Esconda-se e escute (ou use o Toque de Passos): ~65 passos/min = 1 m/s = Revenant.' },
        { nivel: 'forte', titulo: 'Disparada (muito arriscado)', texto: 'Deixe ele te detectar com rota de fuga e incenso prontos. Salto repentino para 3 m/s = Revenant.' }
      ],
      semEvidencia: ['Use o Toque de Passos com ele procurando: ~1 m/s é praticamente exclusivo (Thaye velho e Deildegast lento também chegam perto — compare).'],
      confundido: ['Deildegast (rápido o tempo todo no início).', 'Deogen (desacelera ao chegar perto).', 'Jinn (anda normal antes de te ver).', 'Dayan (velocidade depende de você se mexer).'],
      descartadoPor: ['Velocidade normal (1,7) enquanto não detectou ninguém.'],
      sobrevivencia: ['Esconda-se assim que a caçada começar; correr não adianta.']
    },
    {
      id: 'shade', nome: 'Shade', nomePt: 'Sombra',
      evid: ['emf', 'writing', 'freezing'], forcada: null,
      caca: { texto: '35% (nunca com jogador no cômodo dele)', curto: '35%', max: 35 },
      vel: { texto: '1,7 m/s → 2,8 m/s ao te ver', faixas: [[P, P]], los: 2.8 },
      resumo: 'Tímido: quase nada acontece com gente perto; caça só em 35%.',
      forca: 'Difícil de achar por ser pouco ativo.',
      fraqueza: 'Não caça nem interage com jogador no mesmo cômodo.',
      habilidades: [
        'Caça só com sanidade média ≤ 35%.',
        'Com jogador no cômodo dele: não interage, não faz eventos e não caça.',
        'Eventos falham com 100% de sanidade; aparece como sombra; não faz evento de canto.'
      ],
      sinais: ['Atividade baixíssima com sanidade alta.', 'Aparece como sombra/forma escura nos eventos.'],
      testes: [
        { nivel: 'forte', titulo: 'Sala ocupada', texto: 'Com sanidade bem baixa, fique dentro do cômodo dele (incenso pronto). Se nunca caça/interage enquanto você está lá = Shade.' },
        { nivel: 'conclusivo', titulo: 'Caça acima de 35%', texto: 'Qualquer caçada normal acima de 35% de sanidade média descarta Shade.' }
      ],
      semEvidencia: ['Fique no cômodo dele: qualquer interação/evento/caçada com alguém dentro descarta Shade.', 'Caçar acima de 35% também descarta.'],
      confundido: ['Jinn e Revenant (mesmas 2 evidências) — perigoso testar no mesmo cômodo se for um deles.'],
      descartadoPor: ['Caçar acima de 35%.', 'Interagir/evento/caçar com jogador no cômodo dele.', 'Evento de canto.'],
      sobrevivencia: ['Ficar no cômodo dele é a forma mais segura de não ser caçado.']
    },
    {
      id: 'demon', nome: 'Demon', nomePt: 'Demônio',
      evid: ['uv', 'writing', 'freezing'], forcada: null,
      caca: { texto: '70% (e raramente em QUALQUER sanidade)', curto: '70% (+qualquer)', max: 100 },
      vel: { texto: '1,7 m/s → 2,8 m/s ao te ver', faixas: [[P, P]], los: 2.8 },
      resumo: 'O mais agressivo: caça cedo, cooldown curto e incenso dura menos.',
      forca: 'Caça com mais frequência.',
      fraqueza: 'Crucifixo tem alcance 50% maior contra ele.',
      habilidades: [
        'Caça a partir de 70% e, raramente, com qualquer sanidade.',
        'Intervalo entre caçadas de 20 s (normal 25 s).',
        'Incenso impede caçada por só 60 s (normal 90 s).',
        'Crucifixo: 4,5 m (T1), 6 m (T2), 7,5 m (T3).'
      ],
      sinais: ['Caçadas seguidas com menos de 25 s de intervalo.', 'Caçada 60–90 s depois de um incenso.'],
      testes: [
        { nivel: 'conclusivo', titulo: 'Cooldown < 25 s', texto: 'Use o cronômetro de caçada: se a próxima caçada começou menos de 25 s após o fim da anterior (sem itens amaldiçoados) = Demon.' },
        { nivel: 'conclusivo', titulo: 'Incenso de 60 s', texto: 'Defume e marque o tempo. Caçou entre 60 e 90 s depois = Demon.' },
        { nivel: 'forte', titulo: 'Caça acima de 70%', texto: 'Caçada com média acima de 70% sem item amaldiçoado aponta forte para Demon.' }
      ],
      semEvidencia: ['Cronômetro de incenso e de cooldown são suas melhores armas. Não reacenda o incenso antes de expirar (o timer não reinicia).'],
      confundido: ['Yokai (cedo só se falarem perto).', 'Thaye (cedo no início e acalma).', 'Onryo (caça alta depois de apagar chamas).'],
      descartadoPor: ['Ficar 180 s sem caçar após incenso com sanidade baixa (aponta Spirit).'],
      sobrevivencia: ['Leve crucifixos: o alcance maior compensa.']
    },
    {
      id: 'yurei', nome: 'Yurei',
      evid: ['orb', 'freezing', 'dots'], forcada: null,
      caca: { texto: '50%', max: 50 },
      vel: { texto: '1,7 m/s → 2,8 m/s ao te ver', faixas: [[P, P]], los: 2.8 },
      resumo: 'Bate portas drenando 15% de sanidade; incenso prende ele no cômodo.',
      forca: 'Drena sanidade mais forte.',
      fraqueza: 'Defumar o cômodo dele prende ele lá por 90 s.',
      habilidades: [
        'Fecha totalmente uma porta e drena 15% de quem está a até 7,5 m (deixa EMF 2). Precisa de porta aberta no cômodo.',
        'Fora de caçada só abre/fecha portas por completo, nunca pela metade.',
        'Incenso no cômodo: fica preso 90 s (sem vagar, sem D.O.T.S.).'
      ],
      sinais: ['Porta fechando sozinha + queda de 15% na sanidade.'],
      testes: [
        { nivel: 'forte', titulo: 'Porta a 45°', texto: 'Deixe portas entreabertas perto dele. Se alguma se mover PARCIALMENTE fora de caçada, NÃO é Yurei.' },
        { nivel: 'forte', titulo: 'Preso pelo incenso', texto: 'Defume no cômodo e coloque sensores de movimento nas portas. Se sair do cômodo ou aparecer no D.O.T.S. em menos de 90 s, NÃO é Yurei.' },
        { nivel: 'dica', titulo: 'Batida + 15%', texto: 'Porta fechando sozinha seguida de queda de 15% de sanidade.' }
      ],
      semEvidencia: ['Sensores de movimento nas saídas do cômodo + incenso: se nada dispara por 90 s repetidas vezes, forte sinal.', 'Portas a 45° para descartar.'],
      confundido: ['Aswang e Oni (D.O.T.S. + congelante).'],
      descartadoPor: ['Mover porta parcialmente fora de caçada.', 'Sair do cômodo/D.O.T.S. menos de 90 s após incenso no cômodo.'],
      sobrevivencia: ['Feche as portas do cômodo dele para impedir a habilidade.']
    },
    {
      id: 'oni', nome: 'Oni',
      evid: ['emf', 'freezing', 'dots'], forcada: null,
      caca: { texto: '50%', max: 50 },
      vel: { texto: '1,7 m/s → 2,8 m/s ao te ver', faixas: [[P, P]], los: 2.8 },
      resumo: 'Muito ativo com gente perto, muito visível na caçada e nunca faz evento de névoa.',
      forca: 'Mais ativo com pessoas por perto.',
      fraqueza: 'Fica muito visível, facilitando fotos e identificação.',
      habilidades: [
        'Atividade +30 com jogador a até 6 m ou no cômodo.',
        'Não faz o evento de névoa ("airball"/bola de fumaça).',
        'Fica visível ~55–63% do tempo na caçada (normal ~31–33%).',
        'Colidir com ele em evento drena 20% (normal 10%).'
      ],
      sinais: ['Na caçada quase não pisca — parece sempre visível.', 'Eventos com aparição completa frequentes.'],
      testes: [
        { nivel: 'forte', titulo: 'Sempre visível', texto: 'Observe a caçada: se ele fica visível muito mais tempo do que some = Oni (ou Deogen).' },
        { nivel: 'conclusivo', titulo: 'Evento de névoa', texto: 'Se ocorrer o evento de névoa/bola de fumaça, NÃO é Oni.' }
      ],
      semEvidencia: ['Observe a piscada nas caçadas e os tipos de evento. Névoa descarta.'],
      confundido: ['Deogen (piscada parecida, mas te encontra em qualquer lugar).'],
      descartadoPor: ['Evento de névoa (airball).'],
      sobrevivencia: ['Remédio e incenso: os eventos dele drenam muita sanidade.']
    },
    {
      id: 'yokai', nome: 'Yokai',
      evid: ['orb', 'box', 'dots'], forcada: null,
      caca: { texto: '50% (80% se alguém falar no cômodo dele)', curto: '50% / 80%', max: 80 },
      vel: { texto: '1,7 m/s → 2,8 m/s ao te ver', faixas: [[P, P]], los: 2.8 },
      resumo: 'Falar perto dele faz caçar cedo, mas na caçada quase não ouve.',
      forca: 'Falar perto dele aumenta muito a chance de caçar.',
      fraqueza: 'Na caçada só ouve voz e eletrônicos a até 2,5 m.',
      habilidades: [
        'Caça a partir de 80% se alguém falar (chat de voz) no cômodo dele.',
        'Atividade +30 com voz no cômodo.',
        'Na caçada: detecta voz/eletrônicos só a 2,5 m; visão normal.',
        'Caixa de música: precisa estar a 2,5 m.'
      ],
      sinais: ['Caça logo após conversarem perto dele com sanidade alta.', 'Passa direto por você falando atrás de uma parede.'],
      testes: [
        { nivel: 'forte', titulo: 'Teste do grito', texto: 'Na caçada, fique fora da visão dele mas perto (3–8 m), fale/use eletrônico. Se ele passa direto sem vir até você = Yokai.' },
        { nivel: 'dica', titulo: 'Caça falando', texto: 'Caçou entre 50% e 80% logo depois de alguém conversar no cômodo.' }
      ],
      semEvidencia: ['Teste do grito com cuidado (incenso na mão).', 'Atenção: o desejo da Pata de Macaco de desbloquear esconderijos tira o limite de audição.'],
      confundido: ['Banshee (só persegue o alvo).', 'Demon (caça cedo sem precisar de voz).', 'Kormos (ouve passos de longe).'],
      descartadoPor: ['Vir atrás de você fora de visão por voz/eletrônico a mais de 2,5 m.'],
      sobrevivencia: ['Não converse perto dele; na caçada fique quieto e fora de vista.']
    },
    {
      id: 'hantu', nome: 'Hantu',
      evid: ['orb', 'uv', 'freezing'], forcada: 'freezing',
      caca: { texto: '50%', max: 50 },
      vel: { texto: '1,4 m/s (>15 °C) até 2,7 m/s (<0 °C). NÃO acelera ao te ver', faixas: [[1.4, 2.7]], los: null },
      resumo: 'Mais rápido no frio, lento no quente. Respiração gelada com disjuntor desligado.',
      forca: 'Muito rápido em cômodos frios.',
      fraqueza: 'Lento em cômodos quentes; nunca liga o disjuntor.',
      habilidades: [
        'Velocidade pela temperatura do cômodo: >15 °C 1,4 · 12–15 1,75 · 9–12 2,1 · 6–9 2,3 · 3–6 2,4 · 0–3 2,5 · <0 °C 2,7 m/s.',
        'Com disjuntor desligado, solta respiração gelada a cada ~3 s na caçada (em qualquer dificuldade, mesmo 0 evidência).',
        'Nunca liga o disjuntor e desliga com o dobro da frequência.'
      ],
      sinais: ['Passos mudam de ritmo ao trocar de cômodo.', 'Fumaça de respiração visível durante a caçada com o disjuntor desligado.'],
      testes: [
        { nivel: 'conclusivo', titulo: 'Respiração gelada', texto: 'Desligue o disjuntor. Na caçada, observe a cabeça do fantasma (incenso pronto). Respiração visível = Hantu.' },
        { nivel: 'conclusivo', titulo: 'Ligou o disjuntor?', texto: 'Se o fantasma LIGAR o disjuntor, NÃO é Hantu.' },
        { nivel: 'forte', titulo: 'Sem aceleração', texto: 'Não acelera ao te ver; velocidade varia com a temperatura do cômodo.' }
      ],
      semEvidencia: ['A respiração NÃO conta como evidência, então funciona em 0 evidência. Desligue o disjuntor e observe a caçada.', 'Retire eletrônicos antes, para não confundir com Raiju.'],
      confundido: ['Raiju (acelera perto de eletrônicos).', 'Jinn (acelera ao te ver com disjuntor ligado).', 'Moroi (acelera com sanidade baixa).', 'Mímico (responde no Spirit Box).'],
      descartadoPor: ['Ligar o disjuntor.', 'Acelerar ao te ver.', 'Em 1–2 evidências: não ter Congelante.'],
      sobrevivencia: ['Mantenha o disjuntor LIGADO: aquece a casa e deixa ele mais lento.']
    },
    {
      id: 'goryo', nome: 'Goryo',
      evid: ['emf', 'uv', 'dots'], forcada: 'dots',
      caca: { texto: '50%', max: 50 },
      vel: { texto: '1,7 m/s → 2,8 m/s ao te ver', faixas: [[P, P]], los: 2.8 },
      resumo: 'Silhueta no D.O.T.S. só aparece pela câmera e com o cômodo vazio.',
      forca: 'Só aparece no D.O.T.S. quando ninguém está perto.',
      fraqueza: 'Quase não sai do cômodo favorito e nunca troca de cômodo.',
      habilidades: [
        'Só entra no estado D.O.T.S. com o cômodo vazio; silhueta visível SÓ pela câmera de vídeo.',
        'Vaga pouco e nunca troca de cômodo favorito.',
        'Interage mais que todos com 0% de sanidade.'
      ],
      sinais: ['Eventos e caçadas sempre perto do cômodo.'],
      testes: [
        { nivel: 'conclusivo', titulo: 'D.O.T.S. pela câmera', texto: 'Aponte uma câmera de vídeo para o D.O.T.S. e saia do cômodo. Silhueta na câmera, mas invisível a olho nu = Goryo.' },
        { nivel: 'forte', titulo: 'Fica no cômodo', texto: 'Evento muito longe do cômodo geralmente descarta.' }
      ],
      semEvidencia: ['Muito difícil. Sensores de movimento e sal para medir o quanto ele se afasta. Caçadas sempre começando do mesmo cômodo apontam Goryo.', 'Trocar de cômodo favorito descarta.'],
      confundido: ['Phantom (silhueta visível a olho nu).'],
      descartadoPor: ['Silhueta D.O.T.S. vista a olho nu.', 'Trocar de cômodo favorito.', 'Em 1–2 evidências: não ter D.O.T.S.'],
      sobrevivencia: ['Fique longe do cômodo: ele raramente vai atrás de você longe dali.']
    },
    {
      id: 'myling', nome: 'Myling',
      evid: ['emf', 'uv', 'writing'], forcada: null,
      caca: { texto: '50%', max: 50 },
      vel: { texto: '1,7 m/s → 2,8 m/s ao te ver', faixas: [[P, P]], los: 2.8 },
      resumo: 'Silencioso na caçada (passos só a 12 m); faz sons paranormais com frequência.',
      forca: 'Muito silencioso durante caçadas.',
      fraqueza: 'Faz sons paranormais com mais frequência.',
      habilidades: [
        'Passos e voz na caçada audíveis só a 12 m (normal 20 m).',
        'Eletrônicos começam a falhar a ~10 m, antes de você ouvir os passos.',
        'Sons paranormais a cada 64–127 s (normal 80–127 s).'
      ],
      sinais: ['Lanterna/eletrônicos piscando sem ouvir passos no mesmo andar.'],
      testes: [
        { nivel: 'conclusivo', titulo: 'Sons < 80 s', texto: 'Use o parabólico e o cronômetro livre: dois sons paranormais com menos de 80 s de intervalo = Myling.' },
        { nivel: 'forte', titulo: 'Interferência sem passos', texto: 'Deixe um eletrônico ligado perto do esconderijo. Se ele falhar e você NÃO ouvir passos no mesmo andar = Myling.' }
      ],
      semEvidencia: ['Parabólico + cronômetro (intervalo entre sons).', 'Escute a caçada no mesmo andar: passos só quando já está muito perto.'],
      confundido: ['Raiju (interferência a 15 m, mas barulhento e acelera perto de eletrônicos).'],
      descartadoPor: ['Ouvir passos claramente de longe (>12 m) no mesmo andar.'],
      sobrevivencia: ['Em corredores longos, olhe — silêncio não significa que está longe.']
    },
    {
      id: 'onryo', nome: 'Onryo',
      evid: ['orb', 'box', 'freezing'], forcada: null,
      caca: { texto: '60% (40% com chama a até 4 m; qualquer % a cada 3 chamas apagadas)', curto: '60% (+chamas)', max: 100 },
      vel: { texto: '1,7 m/s → 2,8 m/s ao te ver', faixas: [[P, P]], los: 2.8 },
      resumo: 'Apagar 3 chamas faz ele caçar. Chamas funcionam como crucifixo.',
      forca: 'Apagar chamas pode disparar caçadas.',
      fraqueza: 'Chama acesa perto impede a caçada (ele apaga a chama em vez de caçar).',
      habilidades: [
        'Caça a partir de 60%.',
        'Se tentar caçar perto de chama acesa, apaga a chama no lugar (prioridade sobre o crucifixo).',
        'A cada 3 chamas apagadas, caça independente da sanidade.',
        'Nunca acende fogo sozinho (exceto forçado pelo Vodu).'
      ],
      sinais: ['Apaga vela/isqueiro poucos segundos depois de acesos.', 'Caçada logo após apagar chamas.'],
      testes: [
        { nivel: 'forte', titulo: 'Chama recém-acesa', texto: 'Acenda uma vela perto dele. Se apagar em até ~30 s (20 s nas próximas) = Onryo.' },
        { nivel: 'conclusivo', titulo: 'Vela sobre crucifixo', texto: 'Coloque uma vela acesa em cima de um crucifixo. Se o crucifixo queimar antes da vela apagar, NÃO é Onryo.' },
        { nivel: 'conclusivo', titulo: 'Acendeu fogo?', texto: 'Fantasma acendendo lareira/vela/fogueira descarta Onryo.' }
      ],
      semEvidencia: ['Velas acesas no cômodo + cronômetro. Apagar rapidamente e de forma repetida aponta Onryo.', 'Vela em cima do crucifixo: crucifixo queimado primeiro descarta.'],
      confundido: ['Demon (caça cedo).', 'Mímico — UV em um "Onryo" = Mímico.'],
      descartadoPor: ['Acender fogo.', 'Crucifixo queimar com vela acesa em cima.'],
      sobrevivencia: ['Espalhe velas acesas: funcionam como crucifixos. Cuidado ao deixar ele apagar 3.']
    },
    {
      id: 'twins', nome: 'The Twins', nomePt: 'Os Gêmeos',
      evid: ['emf', 'box', 'freezing'], forcada: null,
      caca: { texto: '50%', max: 50 },
      vel: { texto: 'Cada caçada: lenta ~1,5 m/s ou rápida ~1,9 m/s (acelera ao te ver)', faixas: [[1.5, 1.53], [1.87, 1.9]], los: 3.0 },
      resumo: 'Interage em dois lugares quase ao mesmo tempo; caçadas lentas ou rápidas.',
      forca: 'Um dos "gêmeos" pode iniciar a caçada.',
      fraqueza: 'Interagem ao mesmo tempo, revelando a posição.',
      habilidades: [
        'Interação normal, longe (1–2 s depois, até ~8,5 m / 17 m em mapas grandes) ou as duas.',
        'Interações longe não geram congelante nem resposta no Spirit Box.',
        'Caçada lenta (1,5 m/s) começa onde ele está; rápida (1,9 m/s) começa perto da última interação distante.',
        'A caçada rápida pode começar em cima de um crucifixo.'
      ],
      sinais: ['Duas interações em lugares diferentes com menos de 2 s.', 'Atividade longe do cômodo sem temperatura baixa.'],
      testes: [
        { nivel: 'conclusivo', titulo: 'Interação dupla', texto: 'Duas interações com menos de 2 s de diferença em lugares diferentes = Twins (outros precisam de 2 s+).' },
        { nivel: 'conclusivo', titulo: 'Objetos longe na caçada', texto: 'Portas/objetos se mexendo longe do fantasma durante a caçada.' },
        { nivel: 'dica', titulo: 'Velocidade entre caçadas', texto: 'Use o Toque de Passos: algumas caçadas ~1,5 m/s, outras ~1,9 m/s.' }
      ],
      semEvidencia: ['Sensores de movimento em vários cômodos e atenção a interações quase simultâneas.', 'Meça a velocidade das caçadas: alternar lenta/rápida é forte.'],
      confundido: ['Aswang (sempre lento, nunca rápido).', 'Moroi (velocidade segue a sanidade).', 'Obambo (muda no meio da caçada).'],
      descartadoPor: ['Velocidade padrão 1,7 m/s cravada em várias caçadas.'],
      sobrevivencia: ['A caçada pode começar longe do cômodo — cuidado no "lado seguro" da casa.']
    },
    {
      id: 'raiju', nome: 'Raiju',
      evid: ['emf', 'orb', 'dots'], forcada: null,
      caca: { texto: '50% (65% com eletrônicos ligados no mesmo andar)', curto: '50% / 65%', max: 65 },
      vel: { texto: '1,7 m/s; fixo 2,5 m/s perto de eletrônicos ativos (6/8/10 m conforme o mapa)', faixas: [[P, P], [2.5, 2.5]], los: 2.8 },
      resumo: 'Eletrônicos ligados deixam ele muito rápido e agressivo.',
      forca: 'Drena energia de eletrônicos e acelera perto deles.',
      fraqueza: 'Sem eletrônicos por perto, é um fantasma comum.',
      habilidades: [
        'Perto de eletrônicos ativos: 2,5 m/s fixos (6 m mapa pequeno, 8 m médio, 10 m grande).',
        'Caça a 65% com eletrônico ativo no mesmo andar.',
        'Interferência em eletrônicos até 15 m (normal 10 m); batimento audível a 15 m.'
      ],
      sinais: ['Disparada repentina ao passar por equipamentos, mesmo sem te ver.', 'Eletrônicos falhando muito longe do fantasma.'],
      testes: [
        { nivel: 'forte', titulo: 'Isca elétrica', texto: 'Desligue os eletrônicos ao redor, deixe um ligado perto do esconderijo e escute: passos acelerando ao se aproximar do eletrônico = Raiju.' },
        { nivel: 'dica', titulo: 'Interferência a 15 m', texto: 'Equipamento falhando a ~15 m do fantasma.' }
      ],
      semEvidencia: ['Isca elétrica com o Toque de Passos: 1,7 → 2,5 m/s ao chegar perto de um eletrônico ligado.'],
      confundido: ['Hantu (velocidade pela temperatura).', 'Myling (silencioso).'],
      descartadoPor: ['Manter 1,7 m/s passando ao lado de eletrônico ligado sem te ver.'],
      sobrevivencia: ['Não solte equipamentos ligados durante a caçada; desligue o que estiver segurando.']
    },
    {
      id: 'obake', nome: 'Obake',
      evid: ['emf', 'orb', 'uv'], forcada: 'uv',
      caca: { texto: '50%', max: 50 },
      vel: { texto: '1,7 m/s → 2,8 m/s ao te ver', faixas: [[P, P]], los: 2.8 },
      resumo: 'Muda de forma na caçada e pode deixar digital de 6 dedos.',
      forca: 'Pode deixar menos digitais.',
      fraqueza: 'Às vezes deixa digitais únicas (6 dedos).',
      habilidades: [
        'Deixa digitais 75% das vezes; ~1/6 é especial: mão de 6 dedos, 2 digitais em interruptor, 5 em teclado.',
        'Reduz pela metade o tempo das digitais no mapa.',
        'Muda de modelo (mesmo gênero) por uma piscada durante a caçada.',
        'Depois de pisar no sal às vezes pula uma pegada.'
      ],
      sinais: ['Digital em uma superfície que tocou e não em outra.', 'Na caçada, modelo diferente por um instante.'],
      testes: [
        { nivel: 'conclusivo', titulo: 'Digital de 6 dedos', texto: 'Use a UV em portas/janelas. Mão com 6 dedos ou digitais duplas = Obake (o Mímico também pode copiar).' },
        { nivel: 'conclusivo', titulo: 'Mudança de forma', texto: 'Observe/filme a caçada: troca de modelo por uma piscada = Obake. A câmera de vídeo registra "Ghost Shapeshift".' }
      ],
      semEvidencia: ['Observe a caçada: em equipe, um se esconde e os outros assistem pelas câmeras. Solo, use incenso/sal T3 para dar loop e assistir.'],
      confundido: ['Mímico (copia as mãos de 6 dedos).'],
      descartadoPor: ['Em 1–2 evidências: não ter Ultravioleta.'],
      sobrevivencia: ['Comportamento de caçada padrão.']
    },
    {
      id: 'mimic', nome: 'The Mimic', nomePt: 'O Mímico',
      evid: ['box', 'uv', 'freezing'], forcada: 'orb', mimico: true,
      caca: { texto: 'Igual ao fantasma copiado', curto: 'copia', max: 100 },
      vel: { texto: 'Igual ao fantasma copiado', faixas: [[0.4, 3.0]], los: 3.7 },
      resumo: 'Copia comportamentos de outros fantasmas e SEMPRE mostra orbes extras — até com 0 evidências.',
      forca: 'Imita habilidades e comportamentos de outros fantasmas.',
      fraqueza: 'Orbes fantasmas falsos como evidência extra.',
      habilidades: [
        'Copia atividade, eventos, limite de caçada, velocidade e habilidades — mas não as evidências.',
        'Troca de fantasma copiado ~1 min após abrir a porta e depois a cada 30 s–2 min (nunca durante caçadas/eventos).',
        'Orbes falsos sempre aparecem, mesmo em 0 evidência e não contam no limite.',
        'Mímico masculino não copia Banshee nem Dayan.'
      ],
      sinais: ['Comportamento muda de repente durante o contrato.', 'Mais evidências do que a dificuldade permite (orbe extra).'],
      testes: [
        { nivel: 'conclusivo', titulo: 'Orbe com 0 evidências', texto: 'Em contrato sem evidências: viu orbe na câmera = Mímico.' },
        { nivel: 'conclusivo', titulo: 'Evidência a mais', texto: 'Ex.: Pesadelo (2) e você achou 3 evidências, sendo uma orbe = Mímico.' },
        { nivel: 'conclusivo', titulo: 'Comportamento x evidência', texto: 'Traço de um fantasma + evidência que ele não tem. Ex.: grito de Banshee + Spirit Box.' }
      ],
      semEvidencia: ['Câmera de vídeo no cômodo desde cedo, procurando orbes. Se não houver orbe nenhuma depois de bastante tempo, provavelmente não é Mímico.'],
      confundido: ['Hantu, Kormos, Onryo, Obake (mesmas evidências parciais).'],
      descartadoPor: ['Não ter orbes depois de bastante observação com câmera.'],
      sobrevivencia: ['Trate como o fantasma que ele está copiando no momento.']
    },
    {
      id: 'moroi', nome: 'Moroi',
      evid: ['box', 'writing', 'freezing'], forcada: 'box',
      caca: { texto: '50%', max: 50 },
      vel: { texto: '1,5 m/s (≥45%) até 2,25 m/s (<5%); com visão até 3,71 m/s', faixas: [[1.5, 2.25]], los: 3.71 },
      resumo: 'Amaldiçoa quem fala com ele; fica mais rápido quanto menor a sanidade.',
      forca: 'Quanto menor a sanidade, mais rápido.',
      fraqueza: 'Incenso cega por 7 s (normal 5 s); remédio remove a maldição.',
      habilidades: [
        'Resposta no Spirit Box, som no parabólico ou tentar gravar no Gravador amaldiçoa: dreno de sanidade 2x e a luz não ajuda.',
        'Velocidade por sanidade média: 45%+ 1,5 · 40 1,58 · 35 1,66 · 30 1,75 · 25 1,83 · 20 1,92 · 15 2,0 · 10 2,08 · 5 2,16 · <5% 2,25 m/s.',
        'Muda de velocidade no meio da caçada se a sanidade cruzar uma faixa.'
      ],
      sinais: ['Caçadas cada vez mais rápidas conforme a sanidade cai.', 'Sanidade despencando depois de usar o Spirit Box.'],
      testes: [
        { nivel: 'forte', titulo: 'Velocidade x sanidade', texto: 'Meça a velocidade de várias caçadas (Toque de Passos) e compare com a sanidade média.' },
        { nivel: 'forte', titulo: 'Incenso de 7 s', texto: 'Na caçada, cegue com incenso e cronometre: 7 s em vez de 5 s.' },
        { nivel: 'dica', titulo: 'Remédio no meio da caçada', texto: 'Todos escondidos, alguém toma remédio: desaceleração súbita sugere Moroi.' }
      ],
      semEvidencia: ['Velocidade lenta (~1,5) com sanidade alta e muito rápida com sanidade baixa. Use o Toque de Passos.'],
      confundido: ['Hantu (frio), Twins (aleatório), Raiju, Obambo, Dayan, Gallu, Revenant.'],
      descartadoPor: ['Em 1–2 evidências: não ter Spirit Box.'],
      sobrevivencia: ['Mantenha a sanidade alta com remédios; evite o Spirit Box depois de achar a evidência.']
    },
    {
      id: 'deogen', nome: 'Deogen',
      evid: ['box', 'writing', 'dots'], forcada: 'box',
      caca: { texto: '40%', curto: '40%', max: 40 },
      vel: { texto: '3,0 m/s de longe → 0,4 m/s perto (<2,5 m). Não acelera ao te ver', faixas: [[0.4, 3.0]], los: null },
      resumo: 'Sempre sabe onde você está: corre muito de longe e fica lentíssimo perto.',
      forca: 'Sempre sabe onde os jogadores estão — esconder não funciona.',
      fraqueza: 'Muito lento quando está perto da vítima.',
      habilidades: [
        'Persegue o jogador mais próximo, reavaliando a cada 5–10 s, mesmo escondido.',
        'Caça a 40%.',
        'Respiração pesada ("de touro") no Spirit Box (~1/3 das perguntas a 1 m).',
        'Muito visível na caçada (~53–56%).',
        'Não aparece se o host for nível < 30 (prestígio 0).'
      ],
      sinais: ['Disparada direto até você e freada brusca ao chegar perto.', 'Respiração pesada no Spirit Box.'],
      testes: [
        { nivel: 'conclusivo', titulo: 'Respiração no Spirit Box', texto: 'Faça perguntas no Spirit Box bem do lado dele (sensor de movimento T3 ajuda a achar). Respiração pesada = Deogen.' },
        { nivel: 'forte', titulo: 'Corre e freia', texto: 'Na caçada, ele vem direto até você muito rápido e quase para ao chegar perto. Dê voltas em um móvel.' }
      ],
      semEvidencia: ['Comportamento de caçada é inconfundível: vem direto até o seu esconderijo e anda devagar perto de você.'],
      confundido: ['Oni (muito visível também).', 'Revenant (não desacelera ao chegar perto).'],
      descartadoPor: ['Em 1–2 evidências: não ter Spirit Box.', 'Host abaixo do nível 30.', 'Caçar acima de 40%.'],
      sobrevivencia: ['NÃO se esconda. Faça loop ao redor de móveis/mesas com ele lento perto de você.']
    },
    {
      id: 'thaye', nome: 'Thaye',
      evid: ['orb', 'writing', 'dots'], forcada: null,
      caca: { texto: '75% (jovem) caindo 6 por idade até 15% (velho)', curto: '75% → 15%', max: 75 },
      vel: { texto: '2,75 m/s (idade 0) −0,175 por idade até 1,0 m/s. Não acelera ao te ver', faixas: [[1.0, 2.75]], los: null },
      resumo: 'Envelhece quando você fica perto: começa rápido e agressivo, termina lento e calmo.',
      forca: 'Muito ativo, rápido e agressivo no início.',
      fraqueza: 'Fica mais lento e calmo com o tempo (envelhece com jogadores perto).',
      habilidades: [
        'Tenta envelhecer a partir de 1 min após abrir a porta; com alguém no cômodo/3 m, envelhece 1 ano.',
        'Limite: 75% (idade 0) → 15% (10+). Velocidade: 2,75 → 1,0 m/s.',
        'Atividade começa em 200% e cai até 50%.',
        'No tabuleiro Ouija a idade aumenta a cada envelhecimento.'
      ],
      sinais: ['Primeiras caçadas muito rápidas, cada vez mais lentas.', 'Atividade caindo ao longo do contrato.'],
      testes: [
        { nivel: 'forte', titulo: 'Velocidade entre caçadas', texto: 'Meça cada caçada no Toque de Passos: se ficou mais lenta depois de vocês passarem tempo perto dele = Thaye.' },
        { nivel: 'forte', titulo: 'Idade no Ouija', texto: 'Pergunte a idade no Ouija, passe tempo perto e pergunte de novo. Idade maior = Thaye (custa sanidade).' }
      ],
      semEvidencia: ['Compare a velocidade das caçadas ao longo do tempo e lembre de ficar perto do cômodo para ele envelhecer.'],
      confundido: ['Obambo (acelera ao te ver e muda no meio da caçada).', 'Deildegast, Demon, Deogen.'],
      descartadoPor: ['Acelerar ao te ver.'],
      sobrevivencia: ['Fique perto do cômodo dele no começo (com cuidado) para envelhecer ele rápido.']
    },
    {
      id: 'dayan', nome: 'Dayan', genero: 'f',
      evid: ['emf', 'orb', 'box'], forcada: null, adicionado: 'v0.15.1 (Winter\'s Jest)',
      caca: { texto: '65% se alguém se mexe a 10 m · 45% se parado · 50% ninguém perto', curto: '45–65%', max: 65 },
      vel: { texto: 'Alguém a 10 m: 2,25 m/s se você anda, 1,2 m/s se fica parado. Ninguém perto: 1,7 → 2,8', faixas: [[1.2, 1.2], [P, P], [2.25, 2.25]], los: 2.8 },
      resumo: 'Fica rápida se você se mexe perto dela e lenta se você fica parado.',
      forca: 'Ganha força quando jogadores "dançam" perto dela.',
      fraqueza: 'Perde força quando os jogadores perto ficam parados.',
      habilidades: [
        'Raio de 10 m (atravessa andares).',
        'Velocidade fixa 2,25 (andando) / 1,2 (parado) com jogador no raio.',
        'Sempre feminina.'
      ],
      sinais: ['Velocidade muda conforme você para/anda, mesmo sem ela te ver.'],
      testes: [
        { nivel: 'forte', titulo: 'Parado x andando', texto: 'Na caçada, perto dela (incenso pronto): fique parado e veja ficar lentíssima (~1,2); ande e veja disparar (~2,25) = Dayan.' }
      ],
      semEvidencia: ['Teste parado x andando com o Toque de Passos.', 'Modelo/voz/nome masculino descarta.'],
      confundido: ['Revenant (acelera ao te detectar, não ao você andar).', 'Kormos (cego, ouve passos).'],
      descartadoPor: ['Nome/voz/modelo masculino.'],
      sobrevivencia: ['Agache atrás de algo, fora da visão, e fique PARADO. Em equipe, alguém parado perto deixa ela lenta para todos.']
    },
    {
      id: 'gallu', nome: 'Gallu',
      evid: ['emf', 'box', 'uv'], forcada: null, adicionado: 'v0.15.1 (Winter\'s Jest)',
      caca: { texto: '50% normal · 60% enfurecido · 40% enfraquecido', curto: '40–60%', max: 60 },
      vel: { texto: '1,7 normal · 1,96 enfurecido · 1,36 enfraquecido (acelera ao te ver)', faixas: [[1.36, 1.36], [P, P], [1.955, 1.96]], los: 3.2 },
      resumo: 'Fica furioso quando você usa proteções (crucifixo, incenso, sal) e depois cansa.',
      forca: 'Usar equipamento de proteção deixa ele enfurecido (equipamentos ficam mais fracos).',
      fraqueza: 'Depois de uma caçada enfurecido fica enfraquecido (equipamentos mais fortes).',
      habilidades: [
        'Normal → Enfurecido: queimar crucifixo, fim da cegueira do incenso na caçada, ou 2 s após pisar no sal.',
        'Enfurecido → Enfraquecido: quando uma caçada enfurecida termina.',
        'Enfurecido não pisa no sal; crucifixo tem 2 m a menos de alcance; incenso cega 4 s.',
        'Enfraquecido: crucifixo +1 m, incenso 6 s, deixa 6 pegadas no sal.'
      ],
      sinais: ['Pisa no primeiro sal e ignora os próximos.', 'Caçada mais rápida logo depois de usar crucifixo/incenso.'],
      testes: [
        { nivel: 'forte', titulo: 'Só um monte de sal', texto: 'Coloque vários montes de sal no caminho. Pisou no primeiro e passou por cima dos outros sem pisar = Gallu.' },
        { nivel: 'dica', titulo: 'Proteção que custa caro', texto: 'Use crucifixo ou incenso e compare a velocidade da próxima caçada: mais rápida = Gallu.' }
      ],
      semEvidencia: ['Teste dos vários montes de sal funciona sem evidência.', 'Toque de Passos: ~1,96 m/s depois de proteção, ~1,36 depois de caçada enfurecida.'],
      confundido: ['Wraith (nunca pisa no sal).'],
      descartadoPor: ['Pisar em vários montes de sal seguidos na mesma passagem.'],
      sobrevivencia: ['Remédio T3 dá velocidade sem irritar ele. Sobreviver a uma caçada enfurecida deixa as próximas mais fáceis.']
    },
    {
      id: 'obambo', nome: 'Obambo',
      evid: ['uv', 'writing', 'dots'], forcada: null, adicionado: 'v0.15.1 (Winter\'s Jest)',
      caca: { texto: '10% calmo · 65% agressivo', curto: '10% / 65%', max: 65 },
      vel: { texto: '1,45 m/s calmo · 1,96 m/s agressivo (acelera ao te ver)', faixas: [[1.445, 1.45], [1.955, 1.96]], los: 3.2 },
      resumo: 'Alterna entre calmo e agressivo a cada 2 minutos — até no meio da caçada.',
      forca: 'Agressivo, começa a caçar mais cedo.',
      fraqueza: 'Calmo, demora a caçar e é mais fácil de rastrear.',
      habilidades: [
        'Começa calmo; 1ª troca 1 min após abrir a porta, depois a cada 2 min (inclusive durante caçada).',
        'Atividade: 90 calmo / 25 agressivo (ao contrário do que parece).',
        'Caçada que começa agressiva dura 20% menos.',
        'Acima de 10% de sanidade só caça agressivo (todas as caçadas começam rápidas).'
      ],
      sinais: ['Caçadas curtas.', 'Passos mudando de ritmo sem motivo no meio da caçada.', 'Fases longas de muita e pouca atividade.'],
      testes: [
        { nivel: 'conclusivo', titulo: 'Caçada curta', texto: 'Cronometre as caçadas. Uma caçada ~20% mais curta que o normal do mapa/dificuldade = Obambo.' },
        { nivel: 'forte', titulo: 'Troca no meio da caçada', texto: 'Escute os passos a caçada inteira: mudou de lento para rápido (ou vice-versa) sem motivo = Obambo.' }
      ],
      semEvidencia: ['Use o cronômetro de caçada (ele compara com a duração esperada).', 'Use o cronômetro de contrato: as trocas acontecem em 1:00, 3:00, 5:00... após abrir a porta.'],
      confundido: ['Aswang (sempre começa lento).', 'Twins (alterna entre caçadas, não no meio).', 'Thaye (não acelera ao te ver).'],
      descartadoPor: ['Caçada com duração completa que começou rápida (com sanidade acima de 10%).'],
      sobrevivencia: ['Atividade caindo de repente pode significar que ficou agressivo — cuidado.']
    },
    {
      id: 'kormos', nome: 'Kormos',
      evid: ['orb', 'box', 'uv'], forcada: null, adicionado: 'v0.17.1',
      caca: { texto: '50% (70% se alguém correr no cômodo dele)', curto: '50% / 70%', max: 70 },
      vel: { texto: '1,7 m/s; 2,21 m/s indo até um som; com visão até 2,8', faixas: [[P, P], [2.21, 2.21]], los: 2.8 },
      resumo: 'Quase cego: não vê quem está parado, mas ouve passos de longe.',
      forca: 'Ouve passos de muito longe (correndo 30 m, andando 15 m, agachado 10 m).',
      fraqueza: 'Quase cego — jogador parado não é detectado.',
      habilidades: [
        'Só detecta passos (não respiração/objetos), no mesmo andar. Pulso de audição a cada 1 s.',
        'Se você se mexer a até 5 m sem obstáculos, ele trava em você como se te visse.',
        'Mata ao esbarrar: 0,5 m na hora, 0,6 m após 1 s.',
        'Não faz eventos de névoa nem de perseguição.',
        'Caça a 70% se alguém correr no cômodo dele.'
      ],
      sinais: ['Passa do lado de quem está parado e vai atrás de quem anda longe.'],
      testes: [
        { nivel: 'forte', titulo: 'Estátua (alto risco)', texto: 'Na caçada, fique parado num local aberto (incenso pronto). Passou perto sem vir em você, mas te achou quando andou = Kormos.' },
        { nivel: 'conclusivo', titulo: 'Eventos proibidos', texto: 'Evento de névoa ou de perseguição descarta Kormos.' }
      ],
      semEvidencia: ['Teste da estátua; em equipe, todos parados exceto um que anda longe.', 'Observe os tipos de evento.'],
      confundido: ['Banshee (ignora todos menos o alvo).', 'Yokai (vê normal, não ouve).', 'Mímico (congelante = Mímico).'],
      descartadoPor: ['Evento de névoa ou perseguição.', 'Te achar parado de longe sem esbarrar.'],
      sobrevivencia: ['Não precisa de esconderijo: fique parado num canto fora do caminho. Se andar, agache. Outro andar = não te ouve.']
    },
    {
      id: 'aswang', nome: 'Aswang',
      evid: ['writing', 'freezing', 'dots'], forcada: null, adicionado: 'v0.17.1',
      caca: { texto: '50%', max: 50 },
      vel: { texto: '1,53 m/s; ao te ver acelera muito rápido até 2,53 m/s (~8,7 s)', faixas: [[1.53, 1.53]], los: 2.53 },
      resumo: 'Começa lento e acelera muito rápido ao te ver; não mata em esconderijo oficial.',
      forca: 'A aceleração mais rápida do jogo ao te ver.',
      fraqueza: 'Se te achar em esconderijo oficial, a caçada termina sem matar.',
      habilidades: [
        'Ganha 7,5% da velocidade por segundo com visão (normal 5%).',
        'Ao alcançar alguém em esconderijo oficial (bloqueável), a caçada acaba na hora sem morte.',
        'Na próxima caçada vai direto para esse esconderijo (até no período de graça).'
      ],
      sinais: ['Caçada termina de repente quando chega no seu esconderijo.', 'Começo de caçada lento (~104 passos/min).'],
      testes: [
        { nivel: 'conclusivo', titulo: 'Esconderijo (alto risco)', texto: 'Esconda-se num esconderijo oficial. Se ele te achar e a caçada acabar sem morte = Aswang. Se não for, você morre.' },
        { nivel: 'dica', titulo: 'Velocidade', texto: 'Base 1,53 m/s que nunca sobe entre caçadas e acelera rápido ao te ver.' }
      ],
      semEvidencia: ['Toque de Passos: ~1,53 m/s constante em todas as caçadas.', 'Teste do esconderijo, mudando de esconderijo depois.'],
      confundido: ['Obambo (alterna para rápido 1,96).', 'Twins (alterna lento/rápido).'],
      descartadoPor: ['Matar alguém em esconderijo oficial.', 'Começar caçada rápida.'],
      sobrevivencia: ['Esconderijo oficial é seguro contra ele (se a opção de esconderijos não for 0). Troque de esconderijo depois.']
    },
    {
      id: 'deildegast', nome: 'Deildegast',
      evid: ['emf', 'writing', 'dots'], forcada: null, adicionado: 'v0.18.0',
      caca: { texto: '50%', max: 50 },
      vel: { texto: '3,0 m/s −0,1 por objeto diferente movido (mín. 0,4). Não acelera ao te ver', faixas: [[0.4, 3.0]], los: null },
      resumo: 'Começa extremamente rápido e fica mais lento a cada objeto diferente que vocês movem.',
      forca: 'No início da investigação é o mais rápido.',
      fraqueza: 'Fica mais lento com objetos movidos — até por jogadores mortos.',
      habilidades: [
        '3,0 m/s menos 0,1 por objeto DIFERENTE movido/usado fora da caçada (mín. 0,4 com 26).',
        'Contam: arremessáveis, interruptores, disjuntor, torneiras. Não contam: portas, equipamentos, amaldiçoados.',
        'Contador zera ao fim de cada caçada ou quando um crucifixo queima.',
        'Interage menos com portas/interruptores e 15% das interações falham.'
      ],
      sinais: ['Primeira caçada absurdamente rápida (~232 passos/min) sem acelerar ao te ver.'],
      testes: [
        { nivel: 'forte', titulo: 'Desacelerar', texto: 'Antes da próxima caçada, mova ~15 objetos diferentes (interruptores, torneiras, itens). Se ficou bem mais lento (~1,5 m/s) = Deildegast.' },
        { nivel: 'dica', titulo: 'Primeira caçada', texto: 'Sem mover nada, a caçada a ~3 m/s sem aceleração por visão.' }
      ],
      semEvidencia: ['Toque de Passos antes e depois de mover 15 objetos.', 'Acelerar ao te ver descarta.'],
      confundido: ['Revenant (rápido só ao te detectar).', 'Thaye (fica lento por tempo perto, não por objetos).', 'Deogen (desacelera perto de você).', 'Poltergeist.'],
      descartadoPor: ['Acelerar ao te ver.'],
      sobrevivencia: ['Mova ~15 objetos diferentes entre caçadas. Se morrer, continue mexendo em objetos!']
    }
  ];

  const api = { FANTASMAS };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else Object.assign(root, api);
})(typeof window !== 'undefined' ? window : globalThis);
