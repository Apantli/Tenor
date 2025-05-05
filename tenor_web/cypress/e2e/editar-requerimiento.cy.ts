describe("Test edit requirement", () => {
  // Create a project to view it
  before(() => {
    cy.signIn("/");
    // Dummy test example to view it
    cy.get(".mr-10 > .justify-between > .flex").click();
    cy.get('[placeholder="What is your project called..."]').type(
      "Test project",
    );

    // Create the project
    cy.get(".header > .flex").click();

    // Navigate to the homepage
    cy.visit("/");
    // Check if the logos exists
    cy.get(".flex-row > .flex").should("be.visible");
    cy.contains("Test project").should("be.visible");
    cy.contains("Test project").click();
  });

  beforeEach(() => {
    cy.signIn("/");
  });

  it("Requirements pop up", () => {
    cy.contains("Test project").click();
    cy.contains("Requirements").click();
    cy.get(".gap-1 > .bg-app-primary").click();
    cy.get(".pt-0").should("be.visible");
    cy.get('[placeholder="Briefly describe the requirement..."]').type(
      "Test requirement",)
    cy.get('.pr-9').type("Test requirement description", { force: true });
    cy.get(':nth-child(1) > .relative > :nth-child(1) > .flex').click();
    cy.get(':nth-child(1) > .relative > .fixed > :nth-child(2) > .w-52 > .max-h-40 > :nth-child(1)').click();
    cy.get('.pt-4 > :nth-child(2) > .relative > :nth-child(1) > .flex').click();
    cy.get(':nth-child(2) > .relative > .fixed > :nth-child(2) > .w-52 > .max-h-40 > :nth-child(1)').click();
    cy.get('.pt-4 > :nth-child(3) > .relative > :nth-child(1) > .flex').click();
    cy.get(':nth-child(3) > .relative > .fixed > :nth-child(1) > .whitespace-nowrap > .mb-1').type("Test requirement tag", { force: true });
    cy.get('.fixed > :nth-child(3) > .inline-block').click();
    cy.get('.pt-0').click();
    cy.get('.shrink-0 > div.flex > .flex').click();
    // Wait for the requirement to be created
    cy.wait(1000);
    cy.get(':nth-child(3) > :nth-child(3) > .w-full').click();
    cy.get('.justify-between.gap-2 > .flex > .text-3xl').click();
    cy.get('[placeholder="Briefly describe the requirement..."]').click();
    cy.get('[placeholder="Briefly describe the requirement..."]').clear().type("Test requirement edited", { force: true });
    cy.get('.pr-9').click();
    cy.get('.pr-9').clear().type("Test requirement description edited", { force: true });
    cy.get('.shrink-0 > .flex').click();
  });
});