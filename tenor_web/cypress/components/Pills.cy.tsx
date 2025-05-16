import PillComponent from "~/app/_components/PillComponent";
import { mount } from "cypress/react";
import { useState } from "react";

type Tag = {
  name: string;
  color: string;
  deleted: boolean;
};

describe("Pills", () => {
  const TestComponent = () => {
    const tags = [
      {
        name: "Green",
        color: "#009719",
        deleted: false,
      },
      {
        name: "Pink",
        color: "#CD4EC0",
        deleted: false,
      },
      {
        name: "Blue",
        color: "#0737E3",
        deleted: false,
      },
    ];

    const [tag, setTag] = useState(tags[0] as Tag);
    const [tag2, setTag2] = useState(tags[1] as Tag);

    const dropdownCallback = async (tag: Tag) => {
      setTag(tag);
    };
    const dropdownCallback2 = async (tag: Tag) => {
      setTag2(tag);
    };

    return (
      <div data-cy="pill">
        <PillComponent
          currentTag={tag2}
          allTags={tags}
          callBack={dropdownCallback2}
          labelClassName="w-64"
        />
      </div>
    );
  };

  it("TC001: Pill component", () => {
    mount(<TestComponent />);
    cy.get('[data-cy="pill"]').should("exist");
    cy.get('[data-cy="pill"]').contains("Pink").should("exist");
    cy.get('[data-cy="pill"]').click();
    cy.get(".max-h-40 > :nth-child(1)").should("exist");
    cy.get(".max-h-40 > :nth-child(1)").contains("Green").should("exist");
    cy.get(".max-h-40 > :nth-child(1)").click();
    cy.get(".relative > :nth-child(1) > .flex > .truncate")
      .contains("Green")
      .should("exist");
  });
});
