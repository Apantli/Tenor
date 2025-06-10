describe("Calendar", () => {
  beforeEach(() => {
    cy.openSharedProject();
    cy.get('[data-cy="calendar"]').click();
  });

  it("TC082: Click a cell on the calendar", () => {
    cy.get('[data-cy="calendar-cell"]').first().click();
    cy.get('[data-cy="primary-button"]')
      .contains("Move 0 tasks to")
      .should("be.visible");
  });

  it("TC083: Go to next year", () => {
    cy.get('[data-cy="month"]')
      .invoke("text")
      .then((month) => {
        cy.get('[data-cy="day-number"]')
          .invoke("text")
          .then((year) => {
            for (let i = 0; i < 12; i++) {
              cy.get(
                ':nth-child(3) > button > [data-testid="ChevronRightIcon"]',
              ).click();
            }
            cy.get('[data-cy="month"]').should("have.text", month);
            cy.get('[data-cy="day-number"]').should(
              "have.text",
              Number(year) + 1,
            );
          });
      });
  });

  it("TC083: Go to previous year", () => {
    cy.get('[data-cy="month"]')
      .invoke("text")
      .then((month) => {
        cy.get('[data-cy="day-number"]')
          .invoke("text")
          .then((year) => {
            for (let i = 0; i < 24; i++) {
              cy.get('[data-testid="ChevronLeftIcon"]').click();
            }
            cy.get('[data-cy="month"]').should("have.text", month);
            cy.get('[data-cy="day-number"]').should(
              "have.text",
              Number(year) - 2,
            );
          });
      });
  });
});
