import renderer, { act } from "react-test-renderer";
import React from "react";
import RoutesLayout from "../RoutesLayout.jsx";
import { AuthProvider } from "../context/AuthContext.jsx";
import { MemoryRouter } from "react-router-dom";

describe("chat web application", () => {
  it("renders this project", () => {
    //removed AuthProvider which was previousely wrapped around
    //the MemoryRouter as the test didn't understand which url to fetch.
    //still passed the test but threw an error that looked ugly underneath
    const component = renderer.create(
      <MemoryRouter>
        <RoutesLayout />
      </MemoryRouter>,
    );
    expect(component).toMatchSnapshot();
  });
});
