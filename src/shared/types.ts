export type Msg = { type: 'PING' }

export type MsgResponse =
  | { ok: true; data?: unknown }
  | { ok: false; error: string }
