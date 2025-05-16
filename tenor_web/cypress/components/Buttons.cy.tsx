import { mount } from "cypress/react";
import PrimaryButton from "~/app/_components/buttons/PrimaryButton";
import SecondaryButton from "~/app/_components/buttons/SecondaryButton";

describe("Buttons", () => {
  it("Test Primary Button", () => {
    const onChange = cy.stub();
    mount(
      <PrimaryButton onClick={onChange} className="w-40">
        Primary Button
      </PrimaryButton>,
    );
    cy.get("button").should("have.text", "Primary Button");
    cy.get("button").click();
    cy.wrap(onChange).should("have.been.called");
  });
  it("Test Secondary Button", () => {
    const onChange = cy.stub();
    mount(
      <SecondaryButton onClick={onChange} className="w-40">
        Secondary Button
      </SecondaryButton>,
    );
    cy.get("button").should("have.text", "Secondary Button");
    cy.get("button").click();
    cy.wrap(onChange).should("have.been.called");
  });
});
