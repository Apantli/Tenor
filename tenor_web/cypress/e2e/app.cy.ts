describe("template spec", () => {
  it("passes", () => {
    cy.visit("http://localhost:3000/");
    cy.document().then((doc) => {
      cy.log("EL DIABLO");
      cy.log(doc.documentElement.outerHTML);
    });
    cy.contains("Don't have an account?").click();
    cy.url().should("include", "/register");
    cy.contains("Already have an account?").click();
    cy.url().should("include", "/login");
  });
});
