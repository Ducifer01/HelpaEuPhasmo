const { contextBridge, ipcRenderer } = require('electron');

const canaisEntrada = ['estado', 'config', 'aviso', 'comando', 'atalhos:falhas'];

contextBridge.exposeInMainWorld('overlay', {
  disponivel: true,
  on(canal, cb) {
    if (!canaisEntrada.includes(canal)) return;
    ipcRenderer.on(canal, (_e, dado) => cb(dado));
  },
  iniciar: () => ipcRenderer.invoke('iniciar'),
  acao: (a) => ipcRenderer.send('acao', a),
  modo: (m) => ipcRenderer.send('modo', m),
  atraves: (v) => ipcRenderer.send('atraves', v),
  hudConfig: (k, patch) => ipcRenderer.send('hud:config', { k, patch }),
  hudTamanho: (w, h, topo) => ipcRenderer.send('hud:tamanho', { w, h, topo }),
  capturarMouse: (v) => ipcRenderer.send('mouse:capturar', !!v),
  salvarUi: (ui) => ipcRenderer.send('ui', ui),
  definirAtalhos: (at) => ipcRenderer.invoke('atalhos:definir', at),
  pausarAtalhos: (p) => ipcRenderer.invoke('atalhos:pausar', p),
  ocultar: () => ipcRenderer.send('janela:ocultar'),
  minimizar: () => ipcRenderer.send('janela:minimizar'),
  fechar: () => ipcRenderer.send('janela:fechar')
});
