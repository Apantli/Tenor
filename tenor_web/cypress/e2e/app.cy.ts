describe("template spec", () => {
  it("passes", () => {
    // First ensure the page is loaded
    cy.visit("/");
    cy.contains("Don't have an account?", { timeout: 10000 }).click();
    cy.url().should("include", "/register");
    cy.contains("Already have an account?", { timeout: 10000 }).click();
    cy.url().should("include", "/login");
  });
  it("fails", () => {
    // First ensure the page is loaded
    cy.visit("/");
    cy.contains("Don't have an accounts?", { timeout: 10000 }).click();
    cy.url().should("include", "/register");
    cy.contains("Already have an account?", { timeout: 10000 }).click();
    cy.url().should("include", "/login");
  });
});
