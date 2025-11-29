// OLD-frontend/src/components/HeaderBar.js
import React from "react";

export default function HeaderBar({ title }) {
  return (
    <div
      style={{
        width: "100%",
        background: "#1b37c4",
        padding: "0.8rem 0",
        borderBottom: "3px solid red",
        textAlign: "center",
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}
    >
      <h1
        style={{
          margin: 0,
          color: "#ffffff",
          fontSize: "2.3rem",
          fontWeight: 800,
        }}
      >
        {title}
      </h1>
    </div>
  );
}
