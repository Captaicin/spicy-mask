const prefix = '[EXT]'

type LogArgs = [unknown, ...unknown[]]

export const log = (...args: LogArgs): void => {
  console.log(prefix, ...args)
}

export const warn = (...args: LogArgs): void => {
  console.warn(prefix, ...args)
}

export const error = (...args: LogArgs): void => {
  console.error(prefix, ...args)
}
