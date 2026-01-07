import React from "react";
import Login from "./login";

const Landing: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center p-4">
      <h1 className="text-2xl md:text-4xl font-bold mb-4">
        Welcome to <code>branch.out</code>
      </h1>
      <p className="text-lg text-center mb-6">
        The simplest way to find music events tailored to your taste.
      </p>
      <ol className="list-decimal list-inside mb-6">
        <p className="mb-4">All you need to do is...</p>
        <li className="mb-2">Login with Spotify</li>
        <li className="mb-2">
          Find your top artists, and new artists you might like.
        </li>
        <li className="mb-2">
          Discover events near you featuring artists you love (and some now ones
          you might love soon).
        </li>
      </ol>
      <Login />
    </div>
  );
};

export default Landing;
