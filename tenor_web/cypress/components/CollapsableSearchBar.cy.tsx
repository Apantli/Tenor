import React, { useState } from "react";
import CollapsableSearchBar from "~/app/_components/CollapsableSearchBar";

describe("Collapsable Search Bar", () => {
  const searchValue = "";

  const TestComponent = () => {
    const [value, setValue] = useState(searchValue);

    return <CollapsableSearchBar setSearchText={setValue} searchText={value} />;
  };

  it("Show, type, and close", () => {
    cy.mount(<TestComponent />);
    cy.get("[data-cy=collapsable-search-bar]").should("be.visible");
    cy.get("[data-cy=collapsable-search-bar-icon]").click();
    cy.get("[data-cy=collapsable-search-bar]").get("input").type("searching");
    cy.get("[data-cy=collapsable-search-bar]")
      .get("input")
      .should("have.value", "searching");
    cy.get("[data-cy=collapsable-search-bar-close]").click();
  });
});
