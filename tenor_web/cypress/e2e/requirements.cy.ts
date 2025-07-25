describe("Requirements", () => {
  beforeEach(() => {
    cy.openSharedProject();
    cy.get('[data-cy="requirements"]').click();
  });

  it("TC010: Requirements pop up", () => {
    cy.get(".gap-1 > .bg-app-primary").click();
    cy.get('[data-cy="popup"]').within(() => {
      cy.contains("New Requirement").should("be.visible");
    });
  });

  it("TC012: Create a requirement", () => {
    cy.get('[data-cy="add-requirement-button"]').click();
    cy.get('[data-cy="requirement-name-input"]').type("Test Requirement");
    cy.get('[data-cy="requirement-description-input"]').type(
      "Test requirement description...",
    );
    cy.get(":nth-child(1) > .relative > button.w-full > .flex").click();
    cy.contains("Functional").click();

    cy.get(
      ".gap-2 > :nth-child(2) > .relative > button.w-full > .flex",
    ).click();
    cy.get('[data-cy="dropdown"]').contains("P0").click();
    cy.get(":nth-child(3) > .relative > button.w-full > .flex").click();
    cy.get(
      ".pointer-events-auto > :nth-child(1) > .whitespace-nowrap > .mb-1",
    ).type("Test focus");
    cy.contains("Create Type").click().wait(100);
    cy.get('[data-cy="create-requirement-button"]').click();

    cy.contains("Test Requirement").should("exist");
  });

  it("TC008: Change requirement priority", () => {
    cy.get(":nth-child(4) > .relative > :nth-child(1) > .flex").click();
    cy.contains("P1").click();

    cy.reload();
    cy.contains("P1").should("exist");
  });

  it("TC014: Requirement edit", () => {
    cy.get(":nth-child(3) > :nth-child(3) > .w-full").click();
    cy.get(".justify-between.gap-2 > .flex > .text-3xl").click();
    cy.get('[placeholder="Briefly describe the requirement..."]').click();
    cy.get('[placeholder="Briefly describe the requirement..."]')
      .clear()
      .type("Test requirement edited", { force: true });
    cy.get(".pr-9").click();
    cy.get(".pr-9")
      .clear()
      .type("Test requirement description edited", { force: true });
    cy.get('.shrink-0 > [data-cy="primary-button"]').click();
  });

  it("TC009: Delete requirement", () => {
    // Three dots
    cy.get(".pointer-events-none > .relative > button.w-full > .flex")
      .first()
      .click();
    cy.contains("Delete").click();
    cy.get('[data-cy="confirm-button"]').click();

    cy.contains("No requirements found").should("exist");
  });

  it("TC010: Should not create a requirement without a name", () => {
    cy.get('[data-cy="add-requirement-button"]').click();
    cy.get('[data-cy="create-requirement-button"]').click();
    cy.contains("Please enter a name for the requirement.").should("exist");
  });
});
