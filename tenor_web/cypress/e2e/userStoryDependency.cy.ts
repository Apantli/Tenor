describe("User Stories Dependencies", () => {
  beforeEach(() => {
    cy.openSharedProject();
    cy.get('[data-cy="userStories"]').click();
    cy.get('[data-cy="dismiss-sidebar"]').click();
    cy.contains("Dependency Tree").click();
  });

  it("TC078: Click node in US dependency tree", () => {
    cy.contains("US01").click();
    cy.contains("Acceptance Criteria").should("be.visible");
  });
});
