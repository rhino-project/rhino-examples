import { contextBridge, ipcRenderer } from 'electron';
import { exposeRhinoStorage } from '@rhino-dev/rhino-react/electron/preload';

// Exposes window.rhino.storage (async, IPC-backed) for the renderer adapter.
exposeRhinoStorage({ contextBridge, ipcRenderer });
