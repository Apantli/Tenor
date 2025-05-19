import React, { useState } from "react";
import SearchBar from "~/app/_components/SearchBar";

describe("Search bar", () => {
  const searchValue = "";

  const TestComponent = () => {
    const [value, setValue] = useState(searchValue);

    return (
      <SearchBar
        handleUpdateSearch={(e) => setValue(e.target.value)}
        searchValue={value}
        placeholder="Search..."
      />
    );
  };

  it("Typing", () => {
    cy.mount(<TestComponent />);
    cy.get("[data-cy=search-bar]").should("be.visible");
    cy.get("[data-cy=search-bar]").type("name");
    cy.get("[data-cy=search-bar]").should("have.value", "name");
  });
});
