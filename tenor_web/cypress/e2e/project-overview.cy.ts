
describe("Project Overview", () => {
  beforeEach(() => {
    cy.openSharedProject();
    cy.get('[data-cy="overview"]').click();
  });

  it("TC073: View Project Overview", () => {
    cy.get('[data-cy="overview"]').within(() => {
      cy.contains("Project Overview").should("be.visible");
      cy.get('[data-cy="project-name"]').should("be.visible");
      cy.get('[data-cy="project-description"]').should("be.visible");
      cy.get('[data-cy="project-members"]').should("be.visible");
      cy.get('[data-cy="project-stats"]').should("be.visible");
    });
  });
});