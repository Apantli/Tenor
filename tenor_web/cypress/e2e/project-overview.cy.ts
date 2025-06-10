
describe("Project Overview", () => {
  beforeEach(() => {
    cy.openSharedProject();
    cy.get('[data-cy="overview"]').click();
  });

  it("TC073: View Project Overview", () => {
    cy.contains("Shared Test Project").should("be.visible");
  });

  it("TC074: View project long description", () => {
    cy.contains("Read more").should("be.visible");
    cy.get('[data-cy="tertiary-button"]').click();
    cy.contains("Read less").should("be.visible");
  });

  it("TC075: Filter project recent activity by type ID", () => {
    cy.get('[data-cy="userStories"]').click();
    cy.get('.gap-1 > .relative > .w-full > .flex').click();
    cy.contains("Generate 3 stories", { timeout: 10000 }).should("be.visible").click();
    cy.get('.justify-end > .flex > .bg-app-secondary', { timeout: 10000 }).click();
    cy.wait(5000);
    cy.get('[data-cy="overview"]').click();
    cy.wait(5000);
    cy.get('[data-cy="search-bar"]').type("US01");
  });
});