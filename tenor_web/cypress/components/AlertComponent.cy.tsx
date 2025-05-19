import React, { useState } from "react";
import { AlertProvider, useAlert } from "~/app/_hooks/useAlert";

describe("Collapsable Search Bar", () => {
  const TestComponent = () => {
    const { alert } = useAlert();
    const [shownAlert, setShownAlert] = useState(false);

    if (!shownAlert) {
      alert("Success Alert title", "Alert description", {
        type: "success",
      });
      setShownAlert(true);
    }

    return <></>;
  };

  it("Show, tpye, and close", () => {
    cy.mount(
      <AlertProvider>
        <TestComponent />
      </AlertProvider>,
    );
    cy.get("[data-cy=alert-component]").should("be.visible");
    cy.contains("Alert description").should("be.visible");
  });
});
