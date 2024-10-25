"use client";
import { Tldraw } from "tldraw";
import "./Draw.css";

const DrawPage = () => {
  return (
    <div className="tldraw-wrapper">
      <div style={{ backgroundColor: "white", all: "unset" }}>
        <Tldraw />
      </div>
    </div>
  );
};
export default DrawPage;
