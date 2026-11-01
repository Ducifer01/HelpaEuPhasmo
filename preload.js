const { contextBridge, ipcRenderer } = require('electron');

const canaisEntrada = ['atalho', 'estado:modo', 'estado:clique-atraves', 'atalhos:falhas'];

contextBridge.exposeInMainWorld('overlay', {
  disponivel: true,
  on(canal, cb) {
    if (!canaisEntrada.includes(canal)) return;
    ipcRenderer.on(canal, (_e, dado) => cb(dado));
  },
  obterConfig: () => ipcRenderer.invoke('config:obter'),
  salvarUi: (ui) => ipcRenderer.invoke('config:ui', ui),
  definirAtalhos: (atalhos) => ipcRenderer.invoke('atalhos:definir', atalhos),
  pausarAtalhos: (pausar) => ipcRenderer.invoke('atalhos:pausar', pausar),
  modo: (m) => ipcRenderer.send('janela:modo', m),
  cliqueAtraves: (v) => ipcRenderer.send('janela:clique-atraves', v),
  ocultar: () => ipcRenderer.send('janela:ocultar'),
  minimizar: () => ipcRenderer.send('janela:minimizar'),
  fechar: () => ipcRenderer.send('janela:fechar'),
  redimensionar: (width, height) => ipcRenderer.send('janela:redimensionar', { width, height })
});
