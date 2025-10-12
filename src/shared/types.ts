export type Msg =
  | { type: 'PING' }
  | { type: 'SHOW_OVERLAY' }
  | { type: 'HIDE_OVERLAY' }
  | { type: 'TOGGLE_OVERLAY' }

export type MsgResponse =
  | { ok: true; data?: unknown }
  | { ok: false; error: string }
