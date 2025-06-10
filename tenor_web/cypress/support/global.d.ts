namespace Cypress {
  interface Chainable {
    signIn(
      redirectPath?: string,
      credentials?: { email: string; password: string },
    ): void;
    createEmptyProject(): void;
    createEmptyProjectWithBigInfo(): void;
    openSharedProject(): void;
    openSheredProjectWithBigInfo(): void
  }
}
