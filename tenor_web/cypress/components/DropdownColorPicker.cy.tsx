import DropdownColorPicker from "~/app/_components/inputs/pickers/DropdownColorPicker";
import { mount } from "cypress/react";

describe("DropdownColorPicker", () => {
  it("works", () => {
    mount(
      <DropdownColorPicker
        label="Color Picker"
        onChange={() => {}}
        value="#000000"
        className="w-40"
      />,
    );
    cy.get("input").should("have.value", "#000000");
  });

  it("works", () => {
    const onChange = cy.stub();
    mount(
      <DropdownColorPicker
        label="Color Picker"
        onChange={onChange}
        value="#000000"
        className="w-40"
      />,
    );

    cy.get("span").click();
    cy.get("input").type("{selectall}{backspace}#ff0000");
    cy.wrap(onChange).should("have.been.calledWith", "#ff0000");
  });
});
