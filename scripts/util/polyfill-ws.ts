import ws from 'ws';

(globalThis.WebSocket as unknown) = ws;
