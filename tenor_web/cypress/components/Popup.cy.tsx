import React from "react";
import Popup from "~/app/_components/Popup";
import SecondaryButton from "~/app/_components/buttons/SecondaryButton";
import DeleteButton from "~/app/_components/buttons/DeleteButton";
import "~/styles/globals.css";
import { mount } from "cypress/react";

describe("<Popup />", () => {
  it("renders and visible", () => {
    const TestPopUp = () => {
      const [showSmallPopup, setShowSmallPopup] = React.useState(true);
      return (
        <Popup
          show={showSmallPopup}
          size="small"
          dismiss={() => setShowSmallPopup(false)} // We can use an empty function for testing
          editMode={false}
          footer={
            <div className="flex gap-2">
              <SecondaryButton onClick={() => setShowSmallPopup(true)}>
                Show small popup
              </SecondaryButton>
              <DeleteButton>Delete epic</DeleteButton>
            </div>
          }
        >
          {/* Inside the popup, you can include whatever content you want */}
          <h1 className="mb-5 text-2xl">
            <strong>EP01:</strong> Login System
          </h1>
          <p className="text-lg">
            The Login System enables users to securely access their accounts
            using email and password authentication. It includes features like
            form validation, password recovery, and optional social login
            integration. The system ensures a seamless and secure user
            experience while maintaining compliance with authentication best
            practices.
          </p>
        </Popup>
      );
    };
    mount(<TestPopUp />);

    cy.get("[data-cy=popup]").should("exist");
  });

  it("renders and can be closed", () => {
    const TestPopUp = () => {
      const [showSmallPopup, setShowSmallPopup] = React.useState(true);
      return (
        <Popup
          show={showSmallPopup}
          size="small"
          dismiss={() => setShowSmallPopup(false)} // We can use an empty function for testing
          editMode={false}
          footer={
            <div className="flex gap-2">
              <SecondaryButton onClick={() => setShowSmallPopup(true)}>
                Show small popup
              </SecondaryButton>
              <DeleteButton>Delete epic</DeleteButton>
            </div>
          }
        >
          {/* Inside the popup, you can include whatever content you want */}
          <h1 className="mb-5 text-2xl">
            <strong>EP01:</strong> Login System
          </h1>
          <p className="text-lg">
            The Login System enables users to securely access their accounts
            using email and password authentication. It includes features like
            form validation, password recovery, and optional social login
            integration. The system ensures a seamless and secure user
            experience while maintaining compliance with authentication best
            practices.
          </p>
        </Popup>
      );
    };
    mount(<TestPopUp />);
    cy.get("[data-cy=popup-close-button").click();
    cy.get("[data-cy=popup]").should("not.exist");
  });
});
