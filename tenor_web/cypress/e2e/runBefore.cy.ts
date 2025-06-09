describe("setup, run before all tests", () =>
  it("passes", () => {
    cy.clearLocalStorage();
    cy.clearCookies();
  }));
