import { SegmentedControl } from "../../src/app/_components/SegmentedControl";
import { mount } from "cypress/react";

describe("SegmentedControl", () => {
  it("renders", () => {
    mount(
      <SegmentedControl
        options={["Option 1", "Option 2", "Option 3"]}
        selectedOption={"Option 1"}
        onChange={() => {}}
      />,
    );
    cy.get("button").should("have.length", 3);
  });

  it("changes selected option on click", () => {
    const onChange = cy.stub();
    mount(
      <SegmentedControl
        options={["Option 1", "Option 2", "Option 3"]}
        selectedOption={"Option 1"}
        onChange={onChange}
      />,
    );
    cy.get("button").contains("Option 2").click();
    cy.wrap(onChange).should("have.been.calledWith", "Option 2");
  });
});
