import type { TestProjectInfo } from "cypress/fixtures/types";

describe("Settings: General", () => {
  beforeEach(() => {
    cy.openSharedProject();
    cy.get('[data-cy="settings"]').click();
    cy.window().then((window) => {
      window.localStorage.removeItem("persistent_value:showSettingsSidebar");
    });
  });

  it("TC049: Delete Project", () => {
    cy.get('[data-cy="dismiss-sidebar"').click();
    cy.get('.mt-auto.flex > .flex-row > [data-cy="delete-button"]').click({
      force: true,
    });
    cy.get('[data-cy="popup"]').within(() => {
      cy.get('[data-cy="confirm-button"]').click();
    });
    cy.fixture("testProjectInfo").then((data: TestProjectInfo) => {
      cy.get('[data-cy="project-list"]')
        .find("li")
        .contains(data.name)
        .should("not.exist");
      cy.contains("No projects found.").should("be.visible");
    });
  });
});
