import React from "react";

const Checkmark: React.FC = () => {
  return (
    <div className="checkmark">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="white"
        width="24px"
        height="24px"
      >
        <path d="M0 0h24v24H0z" fill="none" />
        <path d="M9 16.2l-3.5-3.5 1.4-1.4 2.1 2.1 5.3-5.3 1.4 1.4L9 16.2z" />
      </svg>
    </div>
  );
};

export default Checkmark;
