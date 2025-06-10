describe("User Stories Dependencies", () => {
  before(() => {
    cy.openSharedProject();
    cy.get('[data-cy="userStories"]').click();
    cy.get('[data-cy="dismiss-sidebar"').click();

    cy.contains("US01").click();

    cy.get('[data-cy="primary-button"]').contains("+ Add task").click();

    cy.get('[data-cy="popup"]').within(() => {
      cy.get('[placeholder="Enter task name..."]').type("Task to view");
      cy.get('[data-cy="primary-button"]').contains("Create Task").click();
    });
  });

  it("TC079: Click node in dependency tree", () => {
    cy.openSharedProject();
    cy.get('[data-cy="tasks"]').click();

    cy.contains("Organize nodes").should("be.visible"); //wait until in dependency tree

    cy.contains("Task to view").first().click();
    cy.contains("Due Date").should("be.visible");
  });

  it("TC080: Click node in dependency tree and change status", () => {
    cy.openSharedProject();
    cy.get('[data-cy="tasks"]').click();

    cy.contains("Organize nodes").should("be.visible"); //wait until in dependency tree

    cy.contains("Task to view").first().click();
    cy.get(":nth-child(1) > .relative > button.w-full > .flex").click();
    cy.get(
      ".pointer-events-auto > :nth-child(2) > .w-52 > .max-h-48 > :nth-child(2)",
    ).click();
  });
});
