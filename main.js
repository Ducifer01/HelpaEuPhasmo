/*
 * HelpaEuPhasmo — processo principal do Electron.
 *
 * Três janelas transparentes, sem borda e sempre no topo (sobre o jogo em "Janela sem bordas"):
 *   - Dashboard: investigação completa, guia e ajustes;
 *   - HUD Cronômetros e HUD Fantasmas: janelas pequenas que você posiciona e trava no jogo.
 *
 * O estado da partida fica aqui e é repassado a todas as janelas; atalhos globais mexem nele
 * mesmo com o jogo em foco. "Travar" = clique-através: o mouse passa para o jogo, mas o
 * cadeado (HUD) e o botão "Sair" (Dashboard) continuam clicáveis — nunca fica sem saída.
 */
const { app, BrowserWindow, globalShortcut, ipcMain, Tray, Menu, nativeImage, screen, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const Estado = require('./src/js/estado.js');

const ATALHOS_PADRAO = {
  alternarVisivel: 'Control+Alt+H',
  travar: 'F10',
  alternarModo: 'Control+Alt+D',
  novoContrato: 'Control+Alt+N',
  incenso: 'F6',
  cacada: 'F7',
  passo: 'F8',
  contrato: 'F9',
  zerar: 'Control+Alt+0',
  evidencias: 'Alt' // modificador + 1…7 (sem evidência: 1…0 para os sinais únicos)
};

const HUDS_PADRAO = {
  t: { vis: true, trav: false, x: null, y: null, op: 0.78, sz: 1, itens: { incenso: true, cacada: true, contrato: true, passos: true } },
  f: { vis: true, trav: false, x: null, y: null, op: 0.78, sz: 1, itens: { evid: true, lista: true, sug: true } }
};
const DASH_PADRAO = { width: 1180, height: 740 };

let config = null;
let estado = null;
const janelas = { dash: null, t: null, f: null };
const topoAltura = { t: 78, f: 78 }; // altura da barra de controles do HUD destravado
let tray = null;
let atraves = false; // clique-através do Dashboard
let visivel = true;

const arq = (n) => path.join(app.getPath('userData'), n);
const lerJson = (n) => { try { return JSON.parse(fs.readFileSync(arq(n), 'utf8')); } catch (_) { return null; } };
const timersSalvar = {};
function salvarJson(n, obj) {
  clearTimeout(timersSalvar[n]);
  timersSalvar[n] = setTimeout(() => {
    try { fs.mkdirSync(path.dirname(arq(n)), { recursive: true }); fs.writeFileSync(arq(n), JSON.stringify(obj, null, 2)); } catch (e) { console.error('Falha ao salvar', n, e); }
  }, 300);
}

function carregarConfig() {
  const c = lerJson('config.json') || {};
  const at = {};
  for (const k of Object.keys(ATALHOS_PADRAO)) at[k] = (c.atalhos && typeof c.atalhos[k] === 'string') ? c.atalhos[k] : ATALHOS_PADRAO[k];
  const huds = {};
  for (const k of ['t', 'f']) {
    const s = (c.huds && c.huds[k]) || {};
    huds[k] = Object.assign({}, HUDS_PADRAO[k], s, { itens: Object.assign({}, HUDS_PADRAO[k].itens, s.itens || {}) });
  }
  return {
    versaoConfig: 2,
    modo: c.modo === 'jogo' ? 'jogo' : 'dash',
    dash: c.dash || (c.limites && c.limites.dashboard) || null,
    ui: Object.assign({ opacidade: 0.94, zoom: 1 }, c.ui || {}),
    atalhos: at,
    huds
  };
}
const salvarConfig = () => salvarJson('config.json', config);

// ───────────────────────── Janelas ─────────────────────────
function dentroDeAlgumaTela(r) {
  return screen.getAllDisplays().some((d) => {
    const a = d.workArea;
    return r.x + 40 > a.x && r.y + 20 > a.y && r.x < a.x + a.width - 40 && r.y < a.y + a.height - 20;
  });
}

function novaJanela(arquivo, opcoes, consulta) {
  const w = new BrowserWindow(Object.assign({
    frame: false, transparent: true, backgroundColor: '#00000000', hasShadow: false,
    alwaysOnTop: true, fullscreenable: false, maximizable: false, minimizable: true, show: false,
    title: 'HelpaEuPhasmo', icon: path.join(__dirname, 'build', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false, sandbox: true,
      backgroundThrottling: false // cronômetros continuam certos com a janela oculta
    }
  }, opcoes));
  // "screen-saver" é o nível mais alto: fica acima de jogos em janela sem bordas.
  w.setAlwaysOnTop(true, 'screen-saver');
  w.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  w.loadFile(path.join(__dirname, 'src', arquivo), consulta ? { query: consulta } : undefined);
  w.webContents.setWindowOpenHandler(({ url }) => { shell.openExternal(url); return { action: 'deny' }; });
  return w;
}

function criarDashboard() {
  const area = screen.getPrimaryDisplay().workArea;
  let b = config.dash;
  if (!b || !dentroDeAlgumaTela(b)) {
    const width = Math.min(DASH_PADRAO.width, area.width); const height = Math.min(DASH_PADRAO.height, area.height);
    b = { x: area.x + Math.round((area.width - width) / 2), y: area.y + Math.round((area.height - height) / 2), width, height };
  }
  const w = novaJanela('index.html', { ...b, minWidth: 820, minHeight: 520, resizable: true, skipTaskbar: false });
  const guardar = () => { if (!w.isDestroyed() && !w.isMinimized()) { config.dash = w.getBounds(); salvarConfig(); } };
  w.on('moved', guardar); w.on('resized', guardar);
  w.on('closed', () => { janelas.dash = null; });
  janelas.dash = w;
}

function criarHud(k) {
  const h = config.huds[k];
  const area = screen.getPrimaryDisplay().workArea;
  if (h.x == null || !dentroDeAlgumaTela({ x: h.x, y: h.y, width: 300, height: 200 })) {
    h.x = k === 't' ? area.x + 24 : area.x + area.width - 340;
    h.y = area.y + 90;
  }
  const w = novaJanela('hud.html', { x: h.x, y: h.y, width: 330, height: 300, resizable: false, skipTaskbar: true, focusable: true }, { k });
  w.on('moved', () => {
    if (w.isDestroyed()) return;
    const b = w.getBounds();
    // Guarda a posição da caixa (sem a barra de controles), que é o que fica no jogo.
    config.huds[k].x = b.x; config.huds[k].y = b.y + (config.huds[k].trav ? 0 : topoAltura[k]);
    salvarConfig();
  });
  w.on('closed', () => { janelas[k] = null; });
  janelas[k] = w;
  aplicarTrava(k);
}

/** Posição da janela do HUD: destravado, a barra de controles fica acima da caixa. */
function posicionarHud(k) {
  const w = janelas[k]; if (!w || w.isDestroyed()) return;
  const h = config.huds[k];
  const b = w.getBounds();
  w.setBounds({ x: h.x, y: h.trav ? h.y : h.y - topoAltura[k], width: b.width, height: b.height });
}

function aplicarTrava(k) {
  const w = janelas[k]; if (!w || w.isDestroyed()) return;
  const trav = config.huds[k].trav;
  w.setIgnoreMouseEvents(trav, { forward: true });
  w.setFocusable(!trav);
  posicionarHud(k);
}

function aplicarVisibilidade() {
  const jogo = config.modo === 'jogo';
  const d = janelas.dash;
  if (d && !d.isDestroyed()) { if (visivel && !jogo) { d.showInactive(); d.setAlwaysOnTop(true, 'screen-saver'); } else d.hide(); }
  for (const k of ['t', 'f']) {
    const w = janelas[k]; if (!w || w.isDestroyed()) continue;
    if (visivel && jogo && config.huds[k].vis) { w.showInactive(); w.setAlwaysOnTop(true, 'screen-saver'); } else w.hide();
  }
  atualizarBandeja();
}

function todas() { return Object.values(janelas).filter((w) => w && !w.isDestroyed()); }
function enviarTodas(canal, dado) { for (const w of todas()) w.webContents.send(canal, dado); }
function enviarConfig() { enviarTodas('config', publicoConfig()); }
const publicoConfig = () => ({ ...config, atalhosPadrao: ATALHOS_PADRAO, versao: app.getVersion(), atraves, plataforma: process.platform });

// ───────────────────────── Ações ─────────────────────────
function despachar(acao) {
  const r = Estado.aplicar(estado, acao, Date.now());
  estado = r.estado;
  salvarJson('estado.json', estado);
  enviarTodas('estado', estado);
  if (r.aviso) enviarTodas('aviso', r.aviso);
}

function definirModo(modo) {
  config.modo = modo === 'jogo' ? 'jogo' : 'dash';
  if (config.modo === 'dash') definirAtraves(false);
  visivel = true;
  salvarConfig(); enviarConfig(); aplicarVisibilidade();
}

function definirAtraves(v) {
  atraves = !!v;
  const d = janelas.dash;
  if (d && !d.isDestroyed()) d.setIgnoreMouseEvents(atraves, { forward: true });
  enviarConfig(); atualizarBandeja();
}

function configHud(k, patch) {
  const h = config.huds[k]; if (!h) return;
  const travAntes = h.trav;
  if (patch.itens) patch.itens = Object.assign({}, h.itens, patch.itens);
  Object.assign(h, patch);
  if (patch.trav !== undefined && patch.trav !== travAntes) aplicarTrava(k);
  if (patch.vis !== undefined) aplicarVisibilidade();
  salvarConfig(); enviarConfig(); atualizarBandeja();
}

/** F10: no Modo jogo trava/destrava os HUDs; no Dashboard liga/desliga o clique-através. */
function alternarTrava() {
  if (config.modo === 'jogo') {
    const algumSolto = ['t', 'f'].some((k) => config.huds[k].vis && !config.huds[k].trav);
    for (const k of ['t', 'f']) configHud(k, { trav: algumSolto });
  } else definirAtraves(!atraves);
}

function destravarTudo() {
  for (const k of ['t', 'f']) configHud(k, { trav: false });
  definirAtraves(false);
  visivel = true; aplicarVisibilidade();
}

function alternarVisivel() {
  visivel = !visivel;
  if (visivel) definirAtraves(false); // mostrar sempre devolve o mouse ao Dashboard
  aplicarVisibilidade();
}

function executarAtalho(acao) {
  switch (acao) {
    case 'alternarVisivel': return alternarVisivel();
    case 'travar': return alternarTrava();
    case 'alternarModo': return definirModo(config.modo === 'jogo' ? 'dash' : 'jogo');
    case 'novoContrato': definirModo('dash'); return janelas.dash && janelas.dash.webContents.send('comando', 'novoContrato');
    case 'incenso': return despachar({ tipo: 'timer', id: 'incenso' });
    case 'cacada': return despachar({ tipo: 'cacada' });
    case 'passo': return despachar({ tipo: 'toque' });
    case 'contrato': return despachar({ tipo: 'timer', id: 'contrato' });
    case 'zerar': return despachar({ tipo: 'zerar' });
    default: return undefined;
  }
}

function registrarAtalhos() {
  globalShortcut.unregisterAll();
  const falhas = [];
  const reg = (acel, fn, acao) => {
    try { if (!globalShortcut.register(acel, fn)) falhas.push({ acao, acel }); } catch (_) { falhas.push({ acao, acel }); }
  };
  for (const [acao, acel] of Object.entries(config.atalhos)) {
    if (!acel || acao === 'evidencias') continue;
    reg(acel, () => executarAtalho(acao), acao);
  }
  const mod = config.atalhos.evidencias;
  if (mod) for (let n = 1; n <= 10; n++) reg(`${mod}+${n % 10}`, () => despachar({ tipo: 'evidAtalho', n }), 'evidencias');
  return falhas;
}

// ───────────────────────── Bandeja ─────────────────────────
function atualizarBandeja() {
  if (!tray) return;
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: visivel ? 'Ocultar' : 'Mostrar', click: alternarVisivel },
    { label: 'Dashboard', type: 'radio', checked: config.modo === 'dash', click: () => definirModo('dash') },
    { label: 'Modo jogo (HUDs)', type: 'radio', checked: config.modo === 'jogo', click: () => definirModo('jogo') },
    { type: 'separator' },
    { label: 'Destravar tudo', click: destravarTudo },
    { label: 'Mostrar HUD Cronômetros', type: 'checkbox', checked: config.huds.t.vis, click: () => configHud('t', { vis: !config.huds.t.vis }) },
    { label: 'Mostrar HUD Fantasmas', type: 'checkbox', checked: config.huds.f.vis, click: () => configHud('f', { vis: !config.huds.f.vis }) },
    { label: 'Centralizar Dashboard', click: () => { const d = janelas.dash; if (d) { d.center(); definirModo('dash'); } } },
    { type: 'separator' },
    { label: 'Sair', click: () => app.quit() }
  ]));
}
function criarBandeja() {
  try {
    tray = new Tray(nativeImage.createFromPath(path.join(__dirname, 'src', 'tray.png')));
    tray.setToolTip('HelpaEuPhasmo');
    tray.on('click', () => { if (!visivel) alternarVisivel(); else destravarTudo(); });
    atualizarBandeja();
  } catch (e) { console.error('Bandeja indisponível', e); }
}

// ───────────────────────── IPC ─────────────────────────
const deQualJanela = (e) => Object.keys(janelas).find((k) => janelas[k] && !janelas[k].isDestroyed() && janelas[k].webContents === e.sender);

ipcMain.handle('iniciar', () => ({ config: publicoConfig(), estado }));
ipcMain.on('acao', (_e, acao) => { if (acao && typeof acao.tipo === 'string') despachar(acao); });
ipcMain.on('modo', (_e, m) => definirModo(m));
ipcMain.on('atraves', (_e, v) => definirAtraves(typeof v === 'boolean' ? v : !atraves));
ipcMain.on('hud:config', (_e, { k, patch }) => { if (patch && typeof patch === 'object') configHud(k, patch); });
ipcMain.on('hud:tamanho', (e, { w, h, topo }) => {
  const k = deQualJanela(e); const win = janelas[k]; if (!win || k === 'dash') return;
  const b = win.getBounds();
  const nw = Math.max(120, Math.ceil(w)); const nh = Math.max(60, Math.ceil(h));
  if (b.width !== nw || b.height !== nh) win.setBounds({ x: b.x, y: b.y, width: nw, height: nh });
  if (topo && Math.round(topo) !== topoAltura[k]) { topoAltura[k] = Math.round(topo); if (!config.huds[k].trav) posicionarHud(k); }
});
// Com a janela travada, o renderizador pede o mouse de volta enquanto ele está sobre o cadeado / "Sair".
ipcMain.on('mouse:capturar', (e, capturar) => {
  const k = deQualJanela(e); const win = janelas[k]; if (!win) return;
  const travada = k === 'dash' ? atraves : config.huds[k].trav;
  if (travada) win.setIgnoreMouseEvents(!capturar, { forward: true });
});
ipcMain.on('ui', (_e, ui) => { config.ui = Object.assign({}, config.ui, ui); salvarConfig(); enviarConfig(); });
ipcMain.handle('atalhos:definir', (_e, at) => {
  for (const k of Object.keys(ATALHOS_PADRAO)) if (at && typeof at[k] === 'string') config.atalhos[k] = at[k];
  const falhas = registrarAtalhos();
  salvarConfig(); enviarConfig();
  return { falhas, atalhos: config.atalhos };
});
ipcMain.handle('atalhos:pausar', (_e, pausar) => { if (pausar) globalShortcut.unregisterAll(); else registrarAtalhos(); return true; });
ipcMain.on('janela:minimizar', (e) => { const k = deQualJanela(e); if (janelas[k]) janelas[k].minimize(); });
ipcMain.on('janela:ocultar', () => { visivel = false; aplicarVisibilidade(); });
ipcMain.on('janela:fechar', () => app.quit());

// ───────────────────────── Ciclo de vida ─────────────────────────
if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => destravarTudo());
  app.whenReady().then(() => {
    config = carregarConfig();
    estado = Estado.normalizar(lerJson('estado.json'));
    criarDashboard();
    criarHud('t');
    criarHud('f');
    criarBandeja();
    const falhas = registrarAtalhos();
    janelas.dash.webContents.once('did-finish-load', () => {
      aplicarVisibilidade();
      if (falhas.length) janelas.dash.webContents.send('atalhos:falhas', falhas);
    });
    for (const k of ['t', 'f']) janelas[k].webContents.once('did-finish-load', () => aplicarVisibilidade());
  });
  app.on('will-quit', () => globalShortcut.unregisterAll());
  app.on('window-all-closed', () => app.quit());
}
