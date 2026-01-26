import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { JodaPage } from "../joda.page";

describe("JodaPage", () => {
  it("renders the page title", () => {
    render(<JodaPage />);
    expect(screen.getByText("js-joda Playground")).toBeInTheDocument();
  });

  it("shows locale toggle buttons", () => {
    render(<JodaPage />);
    expect(screen.getByRole("button", { name: "DE" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "EN" })).toBeInTheDocument();
  });

  it("shows compare mode checkbox", () => {
    render(<JodaPage />);
    expect(screen.getByLabelText("Compare mode")).toBeInTheDocument();
  });

  it("shows category select", () => {
    render(<JodaPage />);
    expect(screen.getByText("Category")).toBeInTheDocument();
  });

  it("shows snippet select", () => {
    render(<JodaPage />);
    expect(screen.getByText("Snippet")).toBeInTheDocument();
  });

  it("shows empty state when no snippet selected", () => {
    render(<JodaPage />);
    expect(
      screen.getByText("Select a snippet to see output")
    ).toBeInTheDocument();
  });
});
