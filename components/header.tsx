import Login from "./login";

const Header = () => {
  return (
    <header className="flex items-center justify-between p-5 mb-3 bg-gray-900 text-white">
      <h1 className="text-2xl font-bold">
        <code>branch.out</code>
      </h1>
      <Login />
    </header>
  );
};

export default Header;
