describe("Test Scrum preferences", () => {
  beforeEach(() => {
    cy.openSharedProject();
    cy.get('[data-cy="settings"]').click();
    cy.contains("Scrum Preferences").click();
  });

  it("TC067: Modify sprint duration", () => {
    cy.get("[data-cy='sprint-duration'").then(($input) => {
      const currentValue = parseInt($input.val() as string) || 1;
      const newValue = currentValue + 1 > 365 ? 1 : currentValue + 1;

      cy.wrap($input).clear().type(newValue.toString());
      cy.get('[data-cy="primary-button"]').contains("Save").click();
      cy.contains("Scrum settings have been updated").should("be.visible");
    });
  });
});
