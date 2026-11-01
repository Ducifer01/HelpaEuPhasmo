/*
 * Dashboard: investigação (evidências, fantasmas, cronômetros, comportamentos), novo contrato,
 * detalhe do fantasma, guia e ajustes. O estado da partida vem do processo principal.
 */
(function () {
  'use strict';
  const { $, $$, esc, CURTO, ICONES, atalhoTexto, sinaisHtml } = UI;
  const ov = UI.ponte();
  const G = Object.fromEntries(FANTASMAS.map((g) => [g.id, g]));
  const E = Object.fromEntries(EVIDENCIAS.map((e) => [e.id, e]));
  const { ORDEM_EV, SINAIS } = Estado;

  let S = Estado.estadoInicial(); // estado da partida (do processo principal)
  let C = null; // configuração
  let R = {};
  // Estado só da interface
  const P = {
    aba: 'investigar', guia: 'dificuldades', ajs: 'huds', gaveta: null, gavetaAba: 'testes',
    folha: null, catFolha: 'velocidade', busca: '', mostrarDesc: false, contratoTmp: null,
    toast: null, gravando: null, atalhosTmp: null, focarBusca: false
  };

  const nEvid = () => Estado.nEvid(S.contrato);
  const semEv = () => nEvid() === 0;
  const vivos = () => FANTASMAS.filter((g) => R[g.id] && R[g.id].possivel);
  const acao = (a) => ov.acao(a);

  // ───────────────────────── Render ─────────────────────────
  function render() {
    R = Motor.avaliar(Estado.paraMotor(S));
    if (document.activeElement && document.activeElement.id === 'busca') P.focarBusca = true;
    const w = $('#win');
    w.className = 'win' + (C.atraves ? ' atraves' : '');
    w.innerHTML = barra() + (P.aba === 'guia' ? guia() : P.aba === 'ajustes' ? ajustes() : investigar())
      + (P.gaveta ? gaveta() : '') + (P.folha ? folha() : '')
      + (C.atraves ? `<div class="saida" id="saida">Clique-através ligado · o mouse vai para o jogo <kbd>${esc(atalhoTexto(C.atalhos.travar))}</kbd><button data-a="sair-atraves">Sair</button></div>` : '')
      + (P.toast ? `<div class="toast" role="status">${esc(P.toast.texto)}<div class="a">${P.toast.marcar ? '<button class="btn pri" data-a="toast-ok">Marcar</button>' : ''}<button class="btn" data-a="toast-x">Fechar</button></div></div>` : '')
      + '<div class="redim" aria-hidden="true"></div>';
    tick();
    if (P.focarBusca) { const i = $('#busca'); if (i) { i.focus(); i.setSelectionRange(i.value.length, i.value.length); } P.focarBusca = false; }
  }

  function barra() {
    const c = S.contrato;
    const mapa = MAPAS[c.mapa] ? MAPAS[c.mapa].nome : 'mapa ?';
    const n = nEvid();
    return `<div class="barra">
      <span class="marca">Helpa<b>Eu</b>Phasmo</span>
      <button class="pill" data-a="contrato" title="Novo contrato (N)">${esc(Estado.nomeDif(c))}${c.dif === 'semevid' ? '' : ` · ${n === 0 ? 'sem evidências' : n + ' evid.'}`} · ${esc(mapa)} ✎</button>
      <span class="restam">restam <b>${vivos().length}</b> de 30</span>
      <span class="abas" role="tablist">${[['investigar', 'Investigar'], ['guia', 'Guia'], ['ajustes', 'Ajustes']].map(([k, r]) => `<button data-aba="${k}" aria-pressed="${P.aba === k}">${r}</button>`).join('')}</span>
      <span class="ics">
        <button class="ic" data-a="modo" title="Modo jogo: HUDs (H · ${esc(atalhoTexto(C.atalhos.alternarModo))})">${ICONES.hud}</button>
        <button class="ic${C.atraves ? ' on' : ''}" data-a="atraves" title="Clique-através (${esc(atalhoTexto(C.atalhos.travar))})">${ICONES.atraves}</button>
        <button class="ic" data-a="minimizar" title="Minimizar">${ICONES.min}</button>
        <button class="ic x" data-a="fechar" title="Fechar o HelpaEuPhasmo">${ICONES.x}</button>
      </span></div>`;
  }

  function evBotoes() {
    if (semEv()) return sinaisHtml(S, false);
    const v = vivos();
    return ORDEM_EV.map((id, i) => {
      const st = S.evid[id];
      const qtd = v.filter((g) => g.evid.includes(id) || (g.mimico && id === 'orb')).length;
      const s = st === 'sim' ? 'encontrada' : st === 'nao' ? 'descartada' : qtd ? `${qtd} possíveis` : 'nenhum restante';
      return `<button class="ev ${st || ''} ${qtd ? '' : 'morta'}" data-ev="${id}" title="${esc(E[id].dica)}"><span class="n">${CURTO[id]}</span><span class="s">${s}</span><kbd>${i + 1}</kbd></button>`;
    }).join('');
  }

  function investigar() {
    const n = nEvid();
    const achadas = Object.values(S.evid).filter((x) => x === 'sim').length;
    return `<div class="corpo">
      <div class="evbar ${n === 0 ? 'sinais' : ''}">${evBotoes()}
        <div class="evinfo">${n === 0 ? '<span class="rot">Sem evidências<br><small>sinais únicos</small></span>' : `<span class="c">${achadas}<small>/${n}</small></span>`}<button data-a="limpar-ev">limpar</button></div>
      </div>
      <div class="meio">${quadro()}${lado()}</div></div>`;
  }

  function quadro() {
    const v = vivos();
    const mortos = FANTASMAS.filter((g) => !R[g.id].possivel).sort((a, b) => a.nome.localeCompare(b.nome));
    const unico = v.length === 1 ? v[0].id : null;
    const cards = v.slice().sort((a, b) => a.nome.localeCompare(b.nome)).map((g) => cardG(g, unico === g.id)).join('');
    const desc = P.mostrarDesc ? mortos.map((g) => cardG(g, false)).join('') : (mortos.length ? `<div class="descartados">${mortos.map((g) => `<button class="ch" data-g="${g.id}" title="${esc(R[g.id].motivos[0])}">${esc(g.nome)}</button>`).join('')}</div>` : '');
    return `<section class="quadro" aria-label="Fantasmas">
      <div class="quadro-topo"><h2>${unico ? 'É este' : 'Possíveis'}</h2><span class="esp"></span>
        ${mortos.length ? `<button class="link" data-a="desc">${P.mostrarDesc ? 'recolher descartados' : `ver ${mortos.length} descartados em card`}</button>` : ''}</div>
      <div class="lista-g">${v.length ? cards : '<div class="vazio">Nenhum fantasma combina. Revise a última marcação.</div>'}${desc}</div>
    </section>`;
  }

  const evsDo = (g) => (semEv() ? (g.mimico ? ['orb'] : []) : g.evid.concat(g.mimico ? ['orb'] : []));
  function cardG(g, unico) {
    const r = R[g.id];
    const evs = evsDo(g).map((e) => `<span class="d ${S.evid[e] === 'sim' ? 'ok' : ''} ${g.forcada === e ? 'f' : ''}" title="${g.forcada === e ? 'Evidência garantida' : ''}">${CURTO[e]}</span>`).join('');
    return `<button class="g ${r.possivel ? '' : 'morto'} ${unico ? 'unico' : ''}" data-g="${g.id}">
      <span class="t"><span class="nm">${esc(g.nome)}</span>${g.nomePt ? `<span class="pt">${esc(g.nomePt)}</span>` : ''}</span>
      ${evs ? `<span class="dots">${evs}</span>` : ''}
      ${r.possivel ? `<span class="r">${esc(g.resumo)}</span>` : `<span class="mot">✗ ${esc(r.motivos[0])}</span>`}
      <span class="m"><span>caça ${esc(g.caca.curto || g.caca.texto)}</span><span>${esc(velCurta(g))} m/s</span></span>
    </button>`;
  }
  function velCurta(g) {
    if (g.mimico) return 'copia';
    const f = g.vel.faixas; const a = Math.min(...f.map((x) => x[0])); const b = Math.max(...f.map((x) => x[1]));
    const fm = (x) => x.toFixed(2).replace(/0$/, '').replace('.', ',');
    return a === b ? fm(a) + (g.vel.los ? '+' : '') : `${fm(a)}–${fm(b)}`;
  }

  function lado() {
    const sug = Motor.sugerirTestes(Estado.paraMotor(S), R, 5);
    const q = P.busca.trim().toLowerCase();
    const ativos = Object.keys(S.marc);
    const lista = q ? CARACTERISTICAS.filter((m) => (m.nome + ' ' + m.desc).toLowerCase().includes(q)).slice(0, 8) : sug.map((s) => s.m);
    const at = C.atalhos;
    return `<aside class="lado">
      <div class="bloco">
        <div class="topo"><h2>Cronômetros</h2><button class="link" data-a="zerar">zerar</button></div>
        <div class="timers">
          ${tmHtml('incenso', 'Incenso', at.incenso)}${tmHtml('cacada', 'Caçada', at.cacada)}${tmHtml('contrato', 'Contrato', at.contrato)}
          <button class="tm" data-a="toque" title="Toque a cada passo do fantasma durante a caçada"><span class="l">Passos <kbd>${esc(atalhoTexto(at.passo))}</kbd></span><span class="v" id="t-passos">—</span><span class="st" id="t-passos-st">toque no ritmo</span></button>
        </div>
        <div class="san"><span>Caçou acima de</span><div class="seg">${[50, 60, 65, 70, 75, 80].map((n) => `<button data-san="${n}" aria-pressed="${S.san === n}">${n}%</button>`).join('')}</div></div>
      </div>
      <div class="bloco cresce">
        <div class="topo"><h2>Comportamento</h2><button class="link" data-a="todos">ver todos</button></div>
        <label class="busca">${ICONES.lupa}<input id="busca" placeholder="Buscar: sal, rápido, luz, porta…" value="${esc(P.busca)}" autocomplete="off"><kbd>/</kbd></label>
        ${ativos.length ? `<div class="sub">Marcados</div><div class="ativos">${ativos.map((id) => { const m = CARACTERISTICAS.find((x) => x.id === id); if (!m) return ''; const st = S.marc[id]; return `<span class="at ${st}">${st === 'sim' ? '✓' : '✗'} ${esc(st === 'nao' && m.labelNao ? m.labelNao : m.nome)}<button data-desmarc="${id}" aria-label="Remover">×</button></span>`; }).join('')}</div>` : ''}
        <div class="sub">${q ? `Resultados para “${esc(P.busca)}”` : 'Testes que mais separam agora'}</div>
        <div class="marcs">${lista.length ? lista.map(mkLinha).join('') : `<span class="st" style="color:var(--apagado);font-size:12.5px">${q ? 'Nada encontrado.' : 'Nenhum teste separa os que sobraram.'}</span>`}</div>
      </div>
    </aside>`;
  }
  function mkLinha(m) {
    const st = S.marc[m.id];
    const env = [m.sim, m.nao].flatMap((r) => (r ? [...(r.apenas || []), ...(r.exclui || [])] : [])).filter((id) => R[id] && R[id].possivel);
    return `<div class="mk-l ${st || ''}" title="${esc(m.desc)}"><span class="tx">${esc(m.nome)}${env.length ? `<small>${esc([...new Set(env)].slice(0, 4).map((i) => G[i].nome).join(', '))}</small>` : ''}</span>
      <button class="bt s ${st === 'sim' ? 'on' : ''}" data-mk="${m.id}" data-v="sim" title="Sim, aconteceu">✓</button>
      ${m.nao ? `<button class="bt n ${st === 'nao' ? 'on' : ''}" data-mk="${m.id}" data-v="nao" title="${esc(m.labelNao || 'Não')}">✗</button>` : ''}</div>`;
  }
  function tmHtml(id, nome, tecla) {
    return `<button class="tm" data-tm="${id}" data-timer="${id}"><span class="l">${nome} <kbd>${esc(atalhoTexto(tecla))}</kbd></span><span class="v">0:00</span><span class="st"></span>${id === 'incenso' ? '<span class="prog"></span>' + [60, 90, 180].map((s) => `<span class="mk" style="left:${s / 2}%"></span>`).join('') : ''}</button>`;
  }

  function gaveta() {
    const g = G[P.gaveta]; const r = R[g.id];
    const evs = evsDo(g).map((e) => `<span class="d ${S.evid[e] === 'sim' ? 'ok' : ''} ${g.forcada === e ? 'f' : ''}" style="font-size:12px;padding:2px 8px;border-radius:5px;background:rgba(255,255,255,.05)">${CURTO[e]}${g.forcada === e ? ' · garantida' : ''}</span>`).join(' ');
    const lista = (a) => (a && a.length ? `<ul>${a.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : '');
    const h4 = (t) => `<h4 style="margin:12px 0 2px;font:600 11px var(--display);letter-spacing:1px;text-transform:uppercase;color:var(--apagado)">${t}</h4>`;
    let corpo = '';
    if (P.gavetaAba === 'testes') corpo = g.testes.map((t) => `<div class="teste ${t.nivel}"><div class="nv">${esc(t.nivel)}</div><div class="tt">${esc(t.titulo)}</div><div>${esc(t.texto)}</div></div>`).join('') + h4('Descartado se') + lista(g.descartadoPor);
    else if (P.gavetaAba === 'sem') corpo = lista(g.semEvidencia) + h4('Sinais') + lista(g.sinais);
    else corpo = `<p><b>Força:</b> ${esc(g.forca)}</p><p><b>Fraqueza:</b> ${esc(g.fraqueza)}</p>` + lista(g.habilidades) + '<p><b>Confundido com:</b></p>' + lista(g.confundido) + '<p><b>Sobrevivência:</b></p>' + lista(g.sobrevivencia);
    return `<aside class="gaveta" aria-label="Detalhes de ${esc(g.nome)}">
      <div class="gt"><div class="l1"><h3>${esc(g.nome)}</h3><span class="pt" style="color:var(--apagado)">${esc(g.nomePt || '')}</span><span style="flex:1"></span><button class="ic x" data-a="fechar-gaveta" title="Fechar (Esc)">${ICONES.x}</button></div>
        ${r.possivel ? '' : `<div class="motivos">Descartado: ${esc(r.motivos.join(' · '))}</div>`}
        <p>${esc(g.resumo)}</p>${evs ? `<div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:8px">${evs}</div>` : ''}
        <div class="nums"><div class="num"><div class="k">Caça com sanidade</div><div class="v">${esc(g.caca.texto)}</div></div><div class="num"><div class="k">Velocidade</div><div class="v">${esc(g.vel.texto)}</div></div></div></div>
      <div class="tabs">${[['testes', 'Como testar'], ['sem', 'Sem evidência'], ['nums', 'Habilidades']].map(([k, r2]) => `<button data-gaba="${k}" aria-pressed="${P.gavetaAba === k}">${r2}</button>`).join('')}</div>
      <div class="gc">${corpo}</div>
      <div class="rod"><button class="btn" data-a="manual">${S.manual[g.id] ? 'Restaurar' : 'Descartar'}</button><span style="flex:1"></span><button class="btn pri" data-a="fechar-gaveta">Voltar à investigação</button></div>
    </aside>`;
  }

  function folha() {
    if (P.folha === 'todos') {
      const lista = CARACTERISTICAS.filter((m) => m.cat === P.catFolha);
      return `<div class="fundo" data-a="fechar-folha"><div class="folha" role="dialog" aria-label="Todos os comportamentos">
        <div class="acoes" style="margin:0 0 10px"><h3>Todos os comportamentos</h3><button class="ic x" data-a="fechar-folha">${ICONES.x}</button></div>
        <div class="cat-tabs">${CATEGORIAS.map((c) => `<button data-cat="${c.id}" aria-pressed="${P.catFolha === c.id}">${esc(c.nome)}</button>`).join('')}</div>
        <div class="marcs">${lista.map(mkLinha).join('')}</div></div></div>`;
    }
    const c = P.contratoTmp;
    const difs = DIFICULDADES.filter((d) => d.id !== 'apocalipse');
    const d = Estado.difDados(c);
    const n = Estado.nEvid(c);
    const idx = { pequeno: 0, medio: 1, grande: 2 }[c.mapa];
    const ult = S.ultimo;
    return `<div class="fundo" data-a="fechar-folha"><div class="folha" role="dialog" aria-label="Novo contrato">
      <div class="acoes" style="margin:0"><h3>Novo contrato</h3>${ult ? `<button class="btn" data-a="repetir">Repetir último: ${esc(Estado.nomeDif(ult))} · ${esc(MAPAS[ult.mapa] ? MAPAS[ult.mapa].nome : '')}</button>` : ''}</div>
      <p class="lead">Escolha a dificuldade e o mapa. Enter começa.</p>
      <div class="campo"><div class="q">Dificuldade</div><div class="ops">
        ${difs.map((x) => `<button class="op" data-cd="${x.id}" aria-pressed="${c.dif === x.id}"><b>${esc(x.nome)}</b><small>${x.evid == null ? '0 a 3 evidências' : x.evid + (x.evid === 1 ? ' evidência' : ' evidências')}</small></button>`).join('')}
        <button class="op" data-cd="semevid" aria-pressed="${c.dif === 'semevid'}"><b>Sem evidências</b><small>só comportamento</small></button>
      </div>
      ${c.dif === 'personalizada' ? `<div class="linha">Evidências: <span class="seg" style="max-width:220px">${[0, 1, 2, 3].map((k) => `<button data-cn="${k}" aria-pressed="${c.nEvidCustom === k}">${k}</button>`).join('')}</span></div>` : ''}</div>
      <div class="campo"><div class="q">Tamanho do mapa</div><div class="ops">
        ${Object.entries(MAPAS).map(([k, m]) => `<button class="op" data-cm="${k}" aria-pressed="${c.mapa === k}" title="${esc(m.exemplos)}"><b>${esc(m.nome)}</b><small>${esc(m.exemplos.split(',')[0])}…</small></button>`).join('')}
      </div></div>
      <div class="resumo">
        <div><b>Evidências</b>${n === 0 ? 'nenhuma · orbe = Mímico' : n}</div>
        <div><b>Sanidade / remédio</b>${d.sanidadeInicial != null ? `${d.sanidadeInicial}% · +${d.remedio}%` : 'varia'}</div>
        <div><b>Caçada</b>${idx != null ? d.duracaoCaca[idx] + ' s' : '—'} + ${d.graca != null ? d.graca : '0–5'} s de graça</div>
      </div>
      <details class="mais"><summary>Mais opções</summary>
        <div class="linha">Velocidade do fantasma <input type="range" id="c-vel" min="50" max="150" step="25" value="${c.vel}"><b id="c-vel-v">${c.vel}%</b></div>
        <label class="linha"><input type="checkbox" id="c-host" ${c.host30 ? 'checked' : ''}> Host abaixo do nível 30 (Deogen não aparece)</label>
      </details>
      <div class="acoes"><span style="color:var(--apagado);font-size:12px">Começar zera evidências, marcações e cronômetros.</span><button class="btn pri" data-a="comecar">Começar <kbd style="color:#140d2b;border-color:rgba(20,13,43,.4)">Enter</kbd></button></div>
    </div></div>`;
  }

  function guia() {
    const secs = [['dificuldades', 'Dificuldades'], ['mecanicas', 'Mecânicas'], ['semevid', 'Jogar sem evidência'], ['tabela', 'Tabela de fantasmas'], ['amaldicoados', 'Itens amaldiçoados'], ['fontes', 'Fontes']];
    const lista = (a) => `<ul>${a.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>`;
    let c = '';
    if (P.guia === 'dificuldades') {
      c = `<h3>Dificuldades</h3><table class="tab"><tr><th>Nome</th><th>Evid.</th><th>Sanidade</th><th>Remédio</th><th>Setup</th><th>Graça</th><th>Caçada P/M/G</th></tr>
        ${DIFICULDADES.map((d) => `<tr class="${d.id === S.contrato.dif ? 'sel' : ''}"><td><b>${esc(d.nome)}</b></td><td class="num">${d.evid == null ? '0–3' : d.evid}</td><td class="num">${d.sanidadeInicial == null ? '—' : d.sanidadeInicial + '%'}</td><td class="num">${d.remedio == null ? '—' : '+' + d.remedio + '%'}</td><td>${esc(d.setup)}</td><td class="num">${d.graca == null ? '0–5 s' : d.graca + ' s'}</td><td class="num">${d.duracaoCaca.join(' / ')} s</td></tr>`).join('')}</table>
        ${DIFICULDADES.map((d) => `<h4>${esc(d.nome)}</h4>${lista(d.notas || [])}`).join('')}`;
    } else if (P.guia === 'mecanicas') c = '<h3>Mecânicas</h3>' + GUIA.mecanicas.map((s) => `<h4>${esc(s.titulo)}</h4>${lista(s.itens)}`).join('');
    else if (P.guia === 'semevid') c = '<h3>Jogar sem evidência</h3>' + GUIA.semEvidencia.map((s) => `<h4>${esc(s.titulo)}</h4>${lista(s.itens)}`).join('');
    else if (P.guia === 'amaldicoados') c = '<h3>Itens amaldiçoados</h3>' + lista(GUIA.amaldicoados);
    else if (P.guia === 'fontes') c = '<h3>Fontes</h3><ul>' + GUIA.fontes.map((f) => `<li><a href="${esc(f.url)}" target="_blank" rel="noopener" style="color:var(--uv)">${esc(f.nome)}</a></li>`).join('') + '</ul><p style="color:var(--apagado)">Projeto de fãs, sem afiliação com a Kinetic Games.</p>';
    else {
      c = `<h3>Tabela de fantasmas</h3><table class="tab"><tr><th>Fantasma</th>${ORDEM_EV.map((e) => `<th>${CURTO[e]}</th>`).join('')}<th>Caça</th></tr>
        ${FANTASMAS.slice().sort((a, b) => a.nome.localeCompare(b.nome)).map((g) => `<tr><td><b>${esc(g.nome)}</b></td>${ORDEM_EV.map((e) => `<td>${g.evid.includes(e) || (g.mimico && e === 'orb') ? (g.forcada === e ? '★' : '●') : ''}</td>`).join('')}<td>${esc(g.caca.curto || g.caca.texto)}</td></tr>`).join('')}</table>
        <p style="color:var(--apagado);font-size:12px">★ = evidência garantida (aparece mesmo com menos evidências).</p>`;
    }
    return `<div class="pagina"><nav>${secs.map(([k, r]) => `<button data-guia="${k}" aria-pressed="${P.guia === k}">${r}</button>`).join('')}</nav><div class="cont">${c}</div></div>`;
  }

  const ROTULOS = {
    alternarVisivel: 'Mostrar / ocultar tudo', travar: 'Travar HUDs / clique-através', alternarModo: 'Dashboard ↔ Modo jogo',
    incenso: 'Incenso', cacada: 'Caçada começou / acabou', passo: 'Toque de passos', contrato: 'Cronômetro do contrato',
    zerar: 'Zerar cronômetros', novoContrato: 'Novo contrato'
  };
  function ajustes() {
    const secs = [['huds', 'HUDs no jogo'], ['atalhos', 'Atalhos'], ['aparencia', 'Aparência'], ['sobre', 'Sobre']];
    let c = '';
    if (P.ajs === 'atalhos') {
      const at = P.atalhosTmp || C.atalhos;
      const mod = at.evidencias;
      c = `<h3>Atalhos globais</h3><p style="color:var(--apagado);margin:0 0 10px">Funcionam com o jogo em foco. Clique num atalho e aperte a nova combinação (Esc cancela, Backspace limpa).</p>
        <table class="tab">${Object.keys(ROTULOS).map((k) => `<tr><td>${ROTULOS[k]}</td><td><button class="atalho ${P.gravando === k ? 'gravando' : ''}" data-at="${k}">${P.gravando === k ? 'Aperte a combinação…' : esc(atalhoTexto(at[k]))}</button></td></tr>`).join('')}
        <tr><td>Evidências 1 a 7 (sem evidência: sinais 1 a 0)</td><td><span class="seg" style="max-width:300px">${[['Alt', 'Alt + nº'], ['Control+Alt', 'Ctrl + Alt + nº'], ['', 'Desligado']].map(([v, r]) => `<button data-atmod="${v}" aria-pressed="${mod === v}">${r}</button>`).join('')}</span></td></tr></table>
        <p style="color:var(--apagado);font-size:12.5px">Evite Alt + Shift (troca o idioma do teclado no Windows) e teclas que o jogo usa.</p>
        <div class="acoes" style="justify-content:flex-start"><button class="btn" data-a="at-padrao">Restaurar padrões</button><button class="btn pri" data-a="at-salvar"${P.atalhosTmp ? '' : ' disabled'}>Salvar atalhos</button></div>`;
    } else if (P.ajs === 'aparencia') {
      c = `<h3>Aparência do Dashboard</h3>
        <div class="linha" style="max-width:460px">Opacidade <input type="range" id="op" min="0.4" max="1" step="0.05" value="${C.ui.opacidade}"><b id="op-v">${Math.round(C.ui.opacidade * 100)}%</b></div>
        <div class="linha" style="max-width:460px">Tamanho da interface <input type="range" id="zoom" min="0.8" max="1.3" step="0.05" value="${C.ui.zoom}"><b id="zoom-v">${Math.round(C.ui.zoom * 100)}%</b></div>
        <p style="color:var(--apagado);font-size:12.5px">O fundo e o tamanho de cada HUD ficam em "HUDs no jogo".</p>`;
    } else if (P.ajs === 'sobre') {
      c = `<h3>HelpaEuPhasmo ${esc(C.versao || '')}</h3><p>Overlay ajudante para Phasmophobia. Dados conferidos para a v0.19.x (out/2026), 30 fantasmas.</p>
        <h4>Como usar no jogo</h4><ul><li>Deixe o Phasmophobia em <b>Janela sem bordas</b>.</li><li>Configure o contrato aqui, aperte <b>H</b> (ou ${esc(atalhoTexto(C.atalhos.alternarModo))}) para o Modo jogo, posicione os HUDs e trave com ${esc(atalhoTexto(C.atalhos.travar))}.</li><li>Se algo ficar travado: ícone na bandeja → <b>Destravar tudo</b>.</li></ul>
        <p style="color:var(--apagado)">Projeto de fãs, sem afiliação com a Kinetic Games. O app não lê nem altera nada do jogo.</p>`;
    } else {
      const H = C.huds;
      const bloco = (k, nome, itens) => `<div class="aj-hud"><div class="aj-t"><label><input type="checkbox" data-hvis="${k}" ${H[k].vis ? 'checked' : ''}> <b>${nome}</b></label> <span style="color:var(--apagado);font-size:12px">${H[k].trav ? '· travado' : '· solto'}</span></div>
        <div class="linha">Fundo <input type="range" min="0" max="1" step="0.05" value="${H[k].op}" data-hop="${k}"><b data-hopv="${k}">${Math.round(H[k].op * 100)}%</b></div>
        <div class="linha">Tamanho <input type="range" min="0.8" max="1.4" step="0.1" value="${H[k].sz}" data-hsz="${k}"><b data-hszv="${k}">${Math.round(H[k].sz * 100)}%</b></div>
        <div class="aj-itens">${itens.map(([id, r]) => `<label><input type="checkbox" data-hit="${k}:${id}" ${H[k].itens[id] ? 'checked' : ''}> ${r}</label>`).join('')}</div></div>`;
      const at = C.atalhos;
      c = `<h3>HUDs no jogo</h3><p style="color:var(--apagado);margin:0 0 12px">Cada HUD é uma janela própria. No Modo jogo você arrasta pela barra de cima e trava no cadeado (ou todos com ${esc(atalhoTexto(at.travar))}). Posição, fundo e tamanho ficam salvos.</p>
        <div class="aj-huds">${bloco('t', 'Cronômetros', [['incenso', `Incenso (${atalhoTexto(at.incenso)})`], ['cacada', `Caçada (${atalhoTexto(at.cacada)})`], ['contrato', `Contrato (${atalhoTexto(at.contrato)})`], ['passos', `Contador de passos (${atalhoTexto(at.passo)})`]])}
        ${bloco('f', 'Fantasmas', [['evid', 'Evidências (sem evidência: sinais únicos)'], ['lista', 'Fantasmas possíveis'], ['sug', 'Teste sugerido']])}</div>
        <div class="acoes" style="justify-content:flex-start"><button class="btn pri" data-a="modo">Posicionar HUDs no jogo</button><button class="btn" data-a="destravar-huds">Destravar os dois</button></div>`;
    }
    return `<div class="pagina"><nav>${secs.map(([k, r]) => `<button data-ajs="${k}" aria-pressed="${P.ajs === k}">${r}</button>`).join('')}</nav><div class="cont">${c}</div></div>`;
  }

  // ───────────────────────── Cronômetros ─────────────────────────
  function tick() {
    const st = Estado.statusTimers(S, Date.now());
    for (const id of ['incenso', 'cacada', 'contrato']) {
      const s = st[id];
      $$(`[data-timer="${id}"]`).forEach((el) => {
        el.classList.toggle('rodando', s.rodando && !s.perigo); el.classList.toggle('perigo', !!s.perigo);
        $('.v', el).textContent = Estado.fmtTempo(s.ms);
        const x = $('.st', el); x.textContent = s.st; x.className = 'st ' + (s.cls || '');
        const p = $('.prog', el); if (p && s.prog != null) p.style.width = s.prog + '%';
      });
    }
    const pv = $('#t-passos');
    if (pv) {
      pv.textContent = S.med ? S.med.v.toFixed(2).replace('.', ',') : '—';
      const ok = S.med ? Estado.fantasmasPelaVelocidade(S, R) : [];
      $('#t-passos-st').textContent = S.med ? `${Math.round(S.med.bpm)}/min · ${ok.length ? ok.slice(0, 3).join(', ') + (ok.length > 3 ? '…' : '') : 'nenhum sem visão'}` : 'toque no ritmo';
    }
  }

  function mostrarToast(aviso) { P.toast = aviso; clearTimeout(P.toastT); P.toastT = setTimeout(() => { P.toast = null; render(); }, 10000); render(); }
  function abrirContrato() { P.folha = 'contrato'; P.contratoTmp = Object.assign({}, S.contrato); render(); }
  function comecar(c) { acao({ tipo: 'contrato', contrato: c }); P.folha = null; P.gaveta = null; P.busca = ''; P.aba = 'investigar'; }

  // ───────────────────────── Eventos ─────────────────────────
  document.addEventListener('click', (e) => {
    const t = e.target;
    const a = t.closest('[data-a]');
    const si = t.closest('[data-sinal]'); if (si) return acao({ tipo: 'sinal', id: si.dataset.sinal, descartar: e.shiftKey });
    const ev = t.closest('[data-ev]'); if (ev) return acao({ tipo: 'evid', id: ev.dataset.ev, descartar: e.shiftKey });
    const g = t.closest('[data-g]'); if (g) { P.gaveta = g.dataset.g; P.gavetaAba = 'testes'; return render(); }
    const mk = t.closest('[data-mk]'); if (mk) return acao({ tipo: 'marcar', id: mk.dataset.mk, valor: mk.dataset.v });
    const dm = t.closest('[data-desmarc]'); if (dm) return acao({ tipo: 'desmarcar', id: dm.dataset.desmarc });
    const sa = t.closest('[data-san]'); if (sa) return acao({ tipo: 'sanidade', valor: +sa.dataset.san });
    const tm = t.closest('[data-tm]'); if (tm) return acao(tm.dataset.tm === 'cacada' ? { tipo: 'cacada' } : { tipo: 'timer', id: tm.dataset.tm });
    const ab = t.closest('[data-aba]'); if (ab) { P.aba = ab.dataset.aba; P.gaveta = null; return render(); }
    const aj = t.closest('[data-ajs]'); if (aj) { P.ajs = aj.dataset.ajs; return render(); }
    const gu = t.closest('[data-guia]'); if (gu) { P.guia = gu.dataset.guia; return render(); }
    const ga = t.closest('[data-gaba]'); if (ga) { P.gavetaAba = ga.dataset.gaba; return render(); }
    const ca = t.closest('[data-cat]'); if (ca) { P.catFolha = ca.dataset.cat; return render(); }
    const cd = t.closest('[data-cd]'); if (cd) { P.contratoTmp.dif = cd.dataset.cd; return render(); }
    const cn = t.closest('[data-cn]'); if (cn) { P.contratoTmp.nEvidCustom = +cn.dataset.cn; return render(); }
    const cm = t.closest('[data-cm]'); if (cm) { P.contratoTmp.mapa = cm.dataset.cm; return render(); }
    const atb = t.closest('[data-at]'); if (atb) { P.gravando = atb.dataset.at; P.atalhosTmp = P.atalhosTmp || Object.assign({}, C.atalhos); ov.pausarAtalhos(true); return render(); }
    const atm = t.closest('[data-atmod]'); if (atm) { P.atalhosTmp = P.atalhosTmp || Object.assign({}, C.atalhos); P.atalhosTmp.evidencias = atm.dataset.atmod; return render(); }
    if (!a) return undefined;
    switch (a.dataset.a) {
      case 'contrato': return abrirContrato();
      case 'fechar-folha': if (t === a || t.closest('.ic')) { P.folha = null; render(); } return undefined;
      case 'comecar': return comecar(P.contratoTmp);
      case 'repetir': return comecar(S.ultimo);
      case 'modo': return ov.modo('jogo');
      case 'atraves': return ov.atraves(true);
      case 'sair-atraves': ov.capturarMouse(false); return ov.atraves(false);
      case 'minimizar': return ov.minimizar();
      case 'fechar': return ov.fechar();
      case 'desc': P.mostrarDesc = !P.mostrarDesc; return render();
      case 'limpar-ev': return acao({ tipo: 'limparEvid' });
      case 'zerar': return acao({ tipo: 'zerar' });
      case 'toque': return acao({ tipo: 'toque' });
      case 'todos': P.folha = 'todos'; return render();
      case 'fechar-gaveta': P.gaveta = null; return render();
      case 'manual': return acao({ tipo: 'manual', id: P.gaveta });
      case 'toast-ok': if (P.toast && P.toast.marcar) acao({ tipo: 'marcar', id: P.toast.marcar.id, valor: P.toast.marcar.valor, forcar: true }); P.toast = null; return render();
      case 'toast-x': P.toast = null; return render();
      case 'destravar-huds': ov.hudConfig('t', { trav: false }); return ov.hudConfig('f', { trav: false });
      case 'at-padrao': P.atalhosTmp = Object.assign({}, C.atalhosPadrao); return render();
      case 'at-salvar': return salvarAtalhos();
      default: return undefined;
    }
  });
  document.addEventListener('contextmenu', (e) => {
    const si = e.target.closest('[data-sinal]'); if (si) { e.preventDefault(); return acao({ tipo: 'sinal', id: si.dataset.sinal, descartar: true }); }
    const ev = e.target.closest('[data-ev]'); if (ev) { e.preventDefault(); return acao({ tipo: 'evid', id: ev.dataset.ev, descartar: true }); }
    const g = e.target.closest('.g[data-g]'); if (g) { e.preventDefault(); return acao({ tipo: 'manual', id: g.dataset.g }); }
    return undefined;
  });
  document.addEventListener('input', (e) => {
    const d = e.target.dataset || {};
    if (e.target.id === 'busca') { P.busca = e.target.value; P.focarBusca = true; render(); }
    if (e.target.id === 'c-vel') { P.contratoTmp.vel = +e.target.value; $('#c-vel-v').textContent = e.target.value + '%'; }
    if (e.target.id === 'op') { aplicarUi({ opacidade: +e.target.value }); $('#op-v').textContent = Math.round(e.target.value * 100) + '%'; }
    if (e.target.id === 'zoom') { $('#zoom-v').textContent = Math.round(e.target.value * 100) + '%'; }
    if (d.hop) { const l = $(`[data-hopv="${d.hop}"]`); if (l) l.textContent = Math.round(e.target.value * 100) + '%'; }
    if (d.hsz) { const l = $(`[data-hszv="${d.hsz}"]`); if (l) l.textContent = Math.round(e.target.value * 100) + '%'; }
  });
  document.addEventListener('change', (e) => {
    const d = e.target.dataset || {};
    if (e.target.id === 'c-host') P.contratoTmp.host30 = e.target.checked;
    if (e.target.id === 'op') ov.salvarUi({ opacidade: +e.target.value });
    if (e.target.id === 'zoom') { aplicarUi({ zoom: +e.target.value }); ov.salvarUi({ zoom: +e.target.value }); }
    if (d.hop) ov.hudConfig(d.hop, { op: +e.target.value });
    if (d.hsz) ov.hudConfig(d.hsz, { sz: +e.target.value });
    if (d.hvis) ov.hudConfig(d.hvis, { vis: e.target.checked });
    if (d.hit) { const [k, id] = d.hit.split(':'); ov.hudConfig(k, { itens: { [id]: e.target.checked } }); }
  });

  // Captura de atalho
  function teclaAcelerador(e) {
    const c = e.code;
    if (/^Key[A-Z]$/.test(c)) return c.slice(3);
    if (/^Digit[0-9]$/.test(c)) return c.slice(5);
    if (/^F([1-9]|1[0-9]|2[0-4])$/.test(c)) return c;
    if (/^Numpad[0-9]$/.test(c)) return 'num' + c.slice(6);
    const mapa = { Space: 'Space', Tab: 'Tab', Enter: 'Enter', ArrowUp: 'Up', ArrowDown: 'Down', ArrowLeft: 'Left', ArrowRight: 'Right', Insert: 'Insert', Delete: 'Delete', Home: 'Home', End: 'End', PageUp: 'PageUp', PageDown: 'PageDown', NumpadAdd: 'numadd', NumpadSubtract: 'numsub', NumpadMultiply: 'nummult', NumpadDivide: 'numdiv', NumpadDecimal: 'numdec', Minus: '-', Equal: '=', BracketLeft: '[', BracketRight: ']', Semicolon: ';', Quote: "'", Comma: ',', Period: '.', Slash: '/', Backslash: '\\', Backquote: '`', Pause: 'Pause', ScrollLock: 'Scrolllock' };
    return mapa[c] || null;
  }
  function gravarTecla(e) {
    e.preventDefault(); e.stopPropagation();
    if (e.key === 'Escape') { P.gravando = null; ov.pausarAtalhos(false); return render(); }
    if (e.key === 'Backspace') { P.atalhosTmp[P.gravando] = ''; P.gravando = null; ov.pausarAtalhos(false); return render(); }
    const k = teclaAcelerador(e); if (!k) return undefined;
    const partes = [];
    if (e.ctrlKey) partes.push('Control'); if (e.altKey) partes.push('Alt'); if (e.shiftKey) partes.push('Shift'); if (e.metaKey) partes.push('Super');
    partes.push(k);
    const acel = partes.join('+');
    const conflito = Object.keys(ROTULOS).find((x) => x !== P.gravando && P.atalhosTmp[x] === acel);
    if (conflito) mostrarToast({ texto: `"${atalhoTexto(acel)}" já é usado em "${ROTULOS[conflito]}". Ele foi limpo lá.` });
    if (conflito) P.atalhosTmp[conflito] = '';
    P.atalhosTmp[P.gravando] = acel; P.gravando = null; ov.pausarAtalhos(false);
    return render();
  }
  async function salvarAtalhos() {
    const r = await ov.definirAtalhos(P.atalhosTmp);
    P.atalhosTmp = null;
    if (r.falhas.length) mostrarToast({ texto: 'Não consegui registrar: ' + [...new Set(r.falhas.map((f) => atalhoTexto(f.acel)))].join(', ') + '. Outro programa pode estar usando.' });
    else mostrarToast({ texto: 'Atalhos salvos.' });
  }

  document.addEventListener('keydown', (e) => {
    if (P.gravando) return gravarTecla(e);
    const digitando = e.target.tagName === 'INPUT' && e.target.type !== 'checkbox' && e.target.type !== 'range';
    if (e.key === 'Escape') { if (P.busca && digitando) { P.busca = ''; return render(); } if (P.folha) P.folha = null; else if (P.gaveta) P.gaveta = null; else if (C.atraves) return ov.atraves(false); return render(); }
    if (P.folha === 'contrato' && e.key === 'Enter') { e.preventDefault(); return comecar(P.contratoTmp); }
    if (digitando || P.folha || e.ctrlKey || e.altKey || e.metaKey) return undefined;
    if (/^Digit[0-9]$/.test(e.code)) {
      const n = +e.code.slice(5);
      if (semEv()) return acao({ tipo: 'sinal', id: SINAIS[(n + 9) % 10].id, descartar: e.shiftKey });
      if (n >= 1 && n <= 7) return acao({ tipo: 'evid', id: ORDEM_EV[n - 1], descartar: e.shiftKey });
    }
    if (e.key === '/') { e.preventDefault(); P.aba = 'investigar'; P.focarBusca = true; return render(); }
    if (e.key.toLowerCase() === 'n') return abrirContrato();
    if (e.key.toLowerCase() === 'h') return ov.modo('jogo');
    return undefined;
  });

  // Com o clique-através ligado, o botão "Sair" pega o mouse de volta enquanto o cursor está nele.
  document.addEventListener('mouseover', (e) => { if (C && C.atraves && e.target.closest('#saida')) ov.capturarMouse(true); });
  document.addEventListener('mouseout', (e) => { if (C && C.atraves && e.target.closest('#saida') && !(e.relatedTarget && e.relatedTarget.closest && e.relatedTarget.closest('#saida'))) ov.capturarMouse(false); });

  // Redimensionar pela quina (janela sem borda)
  document.addEventListener('pointerdown', (e) => {
    if (!e.target.classList.contains('redim')) return;
    e.preventDefault();
    const x0 = e.screenX; const y0 = e.screenY; const w0 = window.outerWidth; const h0 = window.outerHeight;
    const mover = (ev) => window.resizeTo(Math.max(820, w0 + ev.screenX - x0), Math.max(520, h0 + ev.screenY - y0));
    const soltar = () => { document.removeEventListener('pointermove', mover); document.removeEventListener('pointerup', soltar); };
    document.addEventListener('pointermove', mover); document.addEventListener('pointerup', soltar);
  });

  function aplicarUi(ui) {
    const u = Object.assign({}, C.ui, ui || {});
    document.documentElement.style.setProperty('--janela', `rgba(13, 15, 22, ${u.opacidade})`);
    document.documentElement.style.zoom = u.zoom;
  }

  // ───────────────────────── Início ─────────────────────────
  ov.on('estado', (s) => { S = s; render(); });
  ov.on('config', (c) => { const antes = C && C.ui; C = c; if (!antes || antes.opacidade !== c.ui.opacidade || antes.zoom !== c.ui.zoom) aplicarUi(); render(); });
  ov.on('aviso', (a) => mostrarToast(a));
  ov.on('comando', (cmd) => { if (cmd === 'novoContrato') abrirContrato(); });
  ov.on('atalhos:falhas', (f) => mostrarToast({ texto: 'Atalhos que não consegui registrar: ' + [...new Set(f.map((x) => atalhoTexto(x.acel)))].join(', ') + '. Troque em Ajustes → Atalhos.' }));

  ov.iniciar().then(({ config, estado }) => {
    C = config; S = estado; aplicarUi(); render();
    if (!S.configurado) abrirContrato();
    setInterval(tick, 250);
  });
})();
