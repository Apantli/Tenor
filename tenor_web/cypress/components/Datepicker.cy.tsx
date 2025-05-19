import React, { useState } from "react";
import "~/styles/globals.css";
import { mount } from "cypress/react";
// import InputTextField from "~/app/_components/inputs/InputTextField";
import { DatePicker } from "~/app/_components/DatePicker";

describe("<DatePicker />", () => {
  it("Can render date picker", () => {
    function DatePickerShowcase() {
      const [selectedDate, setSelectedDate] = useState<Date | undefined>(
        undefined,
      );
      return (
        <div>
          <hr />
          <h2 className="my-2 text-2xl font-medium">Date Picker</h2>
          <DatePicker
            selectedDate={selectedDate}
            onChange={setSelectedDate}
            // Any placeholder, can be due date or something similar
            placeholder="Select a date"
            // Adjust for any size
            className="h-3.5 w-48"
          />
        </div>
      );
    }
    mount(<DatePickerShowcase />);

    cy.get("[data-cy=datepicker]").should("exist");
  });
});
