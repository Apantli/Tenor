import TagComponent from "../../src/app/_components/TagComponent";
import { mount } from "cypress/react";

describe("TagComponent", () => {
  it("renders", () => {
    mount(<TagComponent key="Test Tag">Test Tag</TagComponent>);
    cy.get(".flex").should("have.text", "Test Tag");
  });

  it("applies the correct color based on the color prop", () => {
    mount(<TagComponent key="Test Tag" color="#EA2B4E" />);
    cy.get("span").should("have.css", "color", "rgb(234, 43, 78)");
  });
});
