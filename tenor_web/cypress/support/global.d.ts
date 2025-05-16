namespace Cypress {
  interface Chainable {
    signIn(
      redirectPath?: string,
      credentials?: { email: string; password: string },
    ): void;
    createEmptyProject(): void;
    navigateToSharedProject(subPath?: string): Chainable<null>;
    ensureSharedProjectExists(): Chainable<string>;
  }
}