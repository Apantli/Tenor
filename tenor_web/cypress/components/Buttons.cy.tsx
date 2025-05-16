import { mount } from "cypress/react";
import PrimaryButton from "~/app/_components/buttons/PrimaryButton";
import SecondaryButton from "~/app/_components/buttons/SecondaryButton";

describe("Buttons", () => {
  it("Test Primary Button", () => {
    mount(
      <PrimaryButton onClick={() => {}} className="w-40">
        Primary Button
      </PrimaryButton>,
    );
    cy.get("button").should("have.text", "Primary Button");
  });
  it("Test Secondary Button", () => {
    mount(
      <SecondaryButton onClick={() => {}} className="w-40">
        Primary Button
      </SecondaryButton>,
    );
    cy.get("button").should("have.text", "Primary Button");
  });
});
