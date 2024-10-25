"use client";
import { useRef } from "react";
import { Tldraw } from "tldraw";
import "./Draw.css";
import html2canvas from "html2canvas";

const DrawPage = () => {
  const divRef = useRef();
  const takeSnapshot = async () => {
    const canvas = await html2canvas(divRef.current);
    const dataUrl = canvas.toDataURL("image/jpg");

    // Save the image in the public/assets folder
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    const file = new File([blob], "snapshot.jpg", { type: "image/jpg" });

    

    // Use FileSaver or a similar method to save the file
    // Note: You can't directly save to the public folder on the client-side.
    // You need to send it to the server or handle it via API.

    // For demonstration purposes, let's just log the file
    console.log(file);
  };

  return (
    <div className="tldraw-wrapper" ref={divRef}>
      <div style={{ backgroundColor: "white", all: "unset" }}>
        <Tldraw />
      </div>
      <button className="btn btn-neutral" onClick={takeSnapshot}>
        click
      </button>
    </div>
  );
};
export default DrawPage;
