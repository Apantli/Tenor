import PillComponent from "~/app/_components/PillComponent";
import { mount } from "@cypress/react";

describe("Pills", () => {
  const PillTestComponent = () => {
    return (
    <PillComponent
      allTags={[{ name: "Test Pill", color: "#333333", deleted: false }]}
      className="test-class"
      currentTag={{ name: "Test Pill", color: "#333333", deleted: false }}
    />
    )
  }

  it("TC001: Pill component", () => {
    mount(<PillTestComponent />);
    cy.get('[data-cy="pill"]').should("exist");
    cy.get('[data-cy="pill"]').contains("Test Pill").should("exist");
  });
});
