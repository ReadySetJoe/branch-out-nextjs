import { useSession, signIn, signOut } from "next-auth/react";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";

const Login = () => {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef]);

  if (session?.user) {
    return (
      <div className="relative" ref={dropdownRef}>
        <button
          className="flex items-center focus:outline-none"
          onClick={() => setIsOpen(!isOpen)}
        >
          {session.user.image ? (
            <Image
              src={session.user.image}
              alt={session.user.name || "User"}
              width={32}
              height={32}
              className="rounded-full"
            />
          ) : (
            <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
          )}
        </button>
        {isOpen && (
          <div className="absolute right-0 mt-2 w-48 bg-white border rounded shadow-lg">
            <button
              onClick={() => signOut()}
              className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <button
      onClick={() => signIn("spotify")}
      className="bg-green-500 text-white px-4 py-2 rounded-full"
    >
      Sign in with Spotify
    </button>
  );
};

export default Login;
