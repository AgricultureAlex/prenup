import React from "react";
import NavMenuItem from "./NavMenuItem";

function NavMenu() {
  return (
    <ul className="nav-menu">
      <NavMenuItem to="/" label="Home" />
      <NavMenuItem to="/AIChatBot" label="AI Tutor"/>
      <NavMenuItem to="/AITrends" label="AI Trends" />
      <NavMenuItem to="/Settings" label="Settings" />
    </ul>
  );
}

export default NavMenu;