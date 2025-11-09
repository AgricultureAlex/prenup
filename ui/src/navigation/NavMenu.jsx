import React from "react";
import NavMenuItem from "./NavMenuItem";

function NavMenu() {
  return (
    <ul className="nav-menu">
      <NavMenuItem to="/" label="Home" />
      <NavMenuItem to="/progress" label="Progress" />
      <NavMenuItem to="/AIChatBot" label="AI Tutor"/>
      <NavMenuItem to="/Settings" label="Settings" />
      <NavMenuItem to="/Profile" label="Profile" />
    </ul>
  );
}

export default NavMenu;