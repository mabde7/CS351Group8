import React from "react";

export default function HeaderBar({ title }) {
  return (
    <div className="w-full bg-transparent py-[0.8rem] text-center sticky top-0 z-50">
      <h1 className="m-0 text-current text-[2.3rem] font-extrabold">
        {title}
      </h1>
    </div>
  );
}