describe("hope", () => {
  before(() => {
    cy.signIn("/");
  });

  it("Testing", () => {
    cy.visit("/");
  });
});
