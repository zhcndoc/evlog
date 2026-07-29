declare global {
  const useLogger: typeof import('evlog').useLogger
  const log: typeof import('evlog').log
  const createEvlogError: typeof import('evlog').createEvlogError
}

export {}
