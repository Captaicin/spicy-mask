export type Msg =
  | { type: 'PING' }
  | { type: 'GET_COLOR' }
  | { type: 'SET_COLOR'; payload: { color: string } }

export type MsgResponse =
  | { ok: true; data?: unknown }
  | { ok: false; error: string }
