import React from "react";
import "../Draw.css";
import Image from "next/image";

const CanvasBoard = () => {
  return (
    <div class="CanvasContainer">
      {/* <img class="Canvas" src={'/video?type=camera'} alt="webcam" /> */}
      <img
        className="Canvas"
        src={"http://127.0.0.1:5000/video?type=blank"}
        alt="webcam"
        width={1000}
        height={1000}
      />
    </div>
  );
};

export default CanvasBoard;
