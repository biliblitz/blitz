export class DuplicateError extends Error {
  constructor(what: string, example: string) {
    super(`Multiple ${what} found in same route: ${example}`);
  }
}
