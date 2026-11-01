/*
 * HelpaEuPhasmo — processo principal do Electron.
 * Janela transparente, sem borda, sempre no topo (sobre o jogo em "Janela sem bordas"),
 * atalhos globais, ícone na bandeja e modo "clique-através".
 */
const { app, BrowserWindow, globalShortcut, ipcMain, Tray, Menu, nativeImage, screen, shell } = require('electron');
const path = require('path');
const fs = require('fs');

const ATALHOS_PADRAO = {
  alternarVisivel: 'Control+Alt+H',
  cliqueAtraves: 'Control+Alt+C',
  alternarModo: 'Control+Alt+D',
  novoContrato: 'Control+Alt+N',
  incenso: 'F6',
  cacada: 'F7',
  passo: 'F8',
  cronometro: 'F9',
  zerar: 'Control+Alt+0'
};

const TAMANHOS = {
  dashboard: { width: 1280, height: 760 },
  hud: { width: 360, height: 520 }
};

let win = null;
let tray = null;
let cliqueAtraves = false;
let config = null;
const arquivoConfig = () => path.join(app.getPath('userData'), 'config.json');

function carregarConfig() {
  let c = {};
  try { c = JSON.parse(fs.readFileSync(arquivoConfig(), 'utf8')); } catch (_) { /* primeira vez */ }
  return {
    modo: c.modo === 'hud' ? 'hud' : 'dashboard',
    limites: c.limites || {},
    atalhos: Object.assign({}, ATALHOS_PADRAO, c.atalhos || {}),
    ui: c.ui || {}
  };
}
let timerSalvar = null;
function salvarConfig() {
  clearTimeout(timerSalvar);
  timerSalvar = setTimeout(() => {
    try {
      fs.mkdirSync(path.dirname(arquivoConfig()), { recursive: true });
      fs.writeFileSync(arquivoConfig(), JSON.stringify(config, null, 2));
    } catch (e) { console.error('Falha ao salvar config', e); }
  }, 300);
}

function limitesPara(modo) {
  const salvo = config.limites[modo];
  const area = screen.getPrimaryDisplay().workArea;
  const base = TAMANHOS[modo];
  if (salvo && screen.getAllDisplays().some((d) => dentro(salvo, d.workArea))) return salvo;
  if (modo === 'hud') return { x: area.x + area.width - base.width - 20, y: area.y + 80, ...base };
  return {
    x: area.x + Math.max(0, Math.round((area.width - base.width) / 2)),
    y: area.y + Math.max(0, Math.round((area.height - base.height) / 2)),
    width: Math.min(base.width, area.width), height: Math.min(base.height, area.height)
  };
}
function dentro(r, a) {
  return r.x + 40 > a.x && r.y + 20 > a.y && r.x < a.x + a.width - 40 && r.y < a.y + a.height - 20;
}

function criarJanela() {
  const b = limitesPara(config.modo);
  win = new BrowserWindow({
    ...b,
    minWidth: 300,
    minHeight: 220,
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    hasShadow: false,
    resizable: true,
    alwaysOnTop: true,
    skipTaskbar: false,
    fullscreenable: false,
    maximizable: false,
    title: 'HelpaEuPhasmo',
    icon: path.join(__dirname, 'build', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      backgroundThrottling: false // cronômetros continuam precisos com a janela oculta
    }
  });
  // "screen-saver" é o nível mais alto: fica acima de jogos em tela cheia sem bordas.
  win.setAlwaysOnTop(true, 'screen-saver');
  win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  win.loadFile(path.join(__dirname, 'src', 'index.html'));

  const guardar = () => {
    if (!win || win.isDestroyed() || win.isMinimized()) return;
    config.limites[config.modo] = win.getBounds();
    salvarConfig();
  };
  win.on('moved', guardar);
  win.on('resized', guardar);
  win.webContents.setWindowOpenHandler(({ url }) => { shell.openExternal(url); return { action: 'deny' }; });
  win.on('closed', () => { win = null; });
}

function enviar(canal, dado) {
  if (win && !win.isDestroyed()) win.webContents.send(canal, dado);
}

function alternarVisivel() {
  if (!win) return;
  if (win.isVisible()) win.hide();
  else { win.showInactive(); win.setAlwaysOnTop(true, 'screen-saver'); }
}

function definirCliqueAtraves(valor) {
  cliqueAtraves = valor;
  if (win) win.setIgnoreMouseEvents(valor, { forward: true });
  enviar('estado:clique-atraves', valor);
  atualizarBandeja();
}

function definirModo(modo) {
  if (!win) return;
  config.limites[config.modo] = win.getBounds();
  config.modo = modo;
  win.setBounds(limitesPara(modo));
  enviar('estado:modo', modo);
  salvarConfig();
}

function executarAcao(acao) {
  switch (acao) {
    case 'alternarVisivel': return alternarVisivel();
    case 'cliqueAtraves': return definirCliqueAtraves(!cliqueAtraves);
    case 'alternarModo': return definirModo(config.modo === 'hud' ? 'dashboard' : 'hud');
    default: return enviar('atalho', acao);
  }
}

function registrarAtalhos() {
  globalShortcut.unregisterAll();
  const falhas = [];
  for (const [acao, acel] of Object.entries(config.atalhos)) {
    if (!acel) continue;
    try {
      const ok = globalShortcut.register(acel, () => executarAcao(acao));
      if (!ok) falhas.push({ acao, acel });
    } catch (_) {
      falhas.push({ acao, acel });
    }
  }
  return falhas;
}

function atualizarBandeja() {
  if (!tray) return;
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: 'Mostrar / ocultar', click: alternarVisivel },
    { label: 'Dashboard completo', click: () => definirModo('dashboard') },
    { label: 'HUD compacto', click: () => definirModo('hud') },
    { label: 'Clique-através', type: 'checkbox', checked: cliqueAtraves, click: () => definirCliqueAtraves(!cliqueAtraves) },
    { label: 'Centralizar janela', click: () => { if (win) { win.center(); win.showInactive(); } } },
    { type: 'separator' },
    { label: 'Sair', click: () => app.quit() }
  ]));
}

function criarBandeja() {
  try {
    const img = nativeImage.createFromPath(path.join(__dirname, 'src', 'tray.png'));
    tray = new Tray(img);
    tray.setToolTip('HelpaEuPhasmo');
    tray.on('click', alternarVisivel);
    atualizarBandeja();
  } catch (e) { console.error('Bandeja indisponível', e); }
}

// ── IPC ──
ipcMain.handle('config:obter', () => ({ ...config, atalhosPadrao: ATALHOS_PADRAO, versao: app.getVersion(), cliqueAtraves }));
ipcMain.handle('config:ui', (_e, ui) => { config.ui = Object.assign({}, config.ui, ui); salvarConfig(); return true; });
ipcMain.handle('atalhos:definir', (_e, atalhos) => {
  config.atalhos = Object.assign({}, ATALHOS_PADRAO, atalhos || {});
  const falhas = registrarAtalhos();
  salvarConfig();
  return { falhas, atalhos: config.atalhos };
});
ipcMain.handle('atalhos:pausar', (_e, pausar) => { if (pausar) globalShortcut.unregisterAll(); else registrarAtalhos(); return true; });
ipcMain.on('janela:modo', (_e, modo) => definirModo(modo === 'hud' ? 'hud' : 'dashboard'));
ipcMain.on('janela:clique-atraves', (_e, v) => definirCliqueAtraves(typeof v === 'boolean' ? v : !cliqueAtraves));
ipcMain.on('janela:ocultar', () => win && win.hide());
ipcMain.on('janela:minimizar', () => win && win.minimize());
ipcMain.on('janela:fechar', () => app.quit());
ipcMain.on('janela:redimensionar', (_e, { width, height }) => {
  if (!win) return;
  const b = win.getBounds();
  const w = Math.max(300, Math.round(width));
  const h = Math.max(220, Math.round(height));
  win.setBounds({ x: b.x, y: b.y, width: w, height: h });
  config.limites[config.modo] = win.getBounds();
  salvarConfig();
});

// ── Ciclo de vida ──
if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => { if (win) { win.showInactive(); win.focus(); } });
  app.whenReady().then(() => {
    config = carregarConfig();
    criarJanela();
    criarBandeja();
    const falhas = registrarAtalhos();
    win.webContents.once('did-finish-load', () => {
      if (falhas.length) enviar('atalhos:falhas', falhas);
    });
  });
  app.on('will-quit', () => globalShortcut.unregisterAll());
  app.on('window-all-closed', () => app.quit());
}
