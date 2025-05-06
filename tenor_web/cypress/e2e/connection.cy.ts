describe("hope", () => {
  before(() => {
    cy.signIn("/");
  });

  it("Create a project", () => {
    // Dummy test example to verify the connection with auth and firestore
    cy.visit("/");
    cy.get(".mr-10 > .justify-between > .flex").click();
    cy.get('[placeholder="What is your project called..."]').type(
      "Test project",
    );
    cy.get(".header > .flex").click();
    cy.contains("Test project").should("be.visible");
  });
});
