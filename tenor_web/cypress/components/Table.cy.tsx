import { mount } from "cypress/react";
import Table, { type TableColumns } from "~/app/_components/table/Table";

describe("DropdownColorPicker", () => {
  it("works", () => {
    const onDelete = cy.stub();

    function TableShowcase() {
      type TestCols = {
        id: number;
        name: string;
        lastName: string;
      };

      const columns: TableColumns<TestCols> = {
        id: {
          label: "Id",
          width: 100,
        },
        name: {
          label: "Name",
          width: 100,
        },
        lastName: {
          label: "Last Name",
          width: 100,
        },
      };

      const data: TestCols[] = [
        {
          id: 1,
          name: "John",
          lastName: "Doe",
        },
        {
          id: 2,
          name: "Jane",
          lastName: "Smith",
        },
      ];

      return (
        <>
          <Table
            columns={columns}
            data={data}
            tableKey="test-table"
            deletable={true}
            onDelete={onDelete}
          />
          <div id="portal-root"></div>
        </>
      );
    }

    mount(<TableShowcase />);

    cy.get(":nth-child(3) > .relative > :nth-child(1) > .flex").click();
    cy.get(
      ':nth-child(3) > .relative > [data-cy="dropdown"] > .border-b > .w-full',
    ).click();

    cy.wrap(onDelete).should("have.been.calledWith", [1]);
  });
});
