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
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--border-light)] transition-colors"
          onClick={() => setIsOpen(!isOpen)}
        >
          {session.user.image ? (
            <Image
              src={session.user.image}
              alt={session.user.name || "User"}
              width={28}
              height={28}
              className="rounded-full"
            />
          ) : (
            <div className="w-7 h-7 bg-[var(--surface-hover)] rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-[var(--text-secondary)]">
                {session.user.name?.charAt(0) || "U"}
              </span>
            </div>
          )}
          <span className="text-sm font-medium text-[var(--text-primary)] hidden sm:inline">
            {session.user.name?.split(" ")[0]}
          </span>
          <svg
            className={`w-4 h-4 text-[var(--text-muted)] transition-transform ${
              isOpen ? "rotate-180" : ""
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>
        {isOpen && (
          <div className="absolute right-0 mt-2 w-48 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg shadow-xl overflow-hidden animate-fade-in">
            <div className="px-4 py-3 border-b border-[var(--border)]">
              <p className="text-sm font-medium text-[var(--text-primary)]">
                {session.user.name}
              </p>
              <p className="text-xs text-[var(--text-muted)] truncate">
                {session.user.email}
              </p>
            </div>
            <button
              onClick={() => signOut()}
              className="w-full text-left px-4 py-3 text-sm text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)] transition-colors"
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
      className="flex items-center gap-2 btn"
    >
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
      </svg>
      <span>Sign in with Spotify</span>
    </button>
  );
};

export default Login;
