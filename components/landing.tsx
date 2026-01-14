import React from "react";
import Login from "./login";

const Landing: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 py-12">
      {/* Hero Section */}
      <div className="text-center max-w-2xl mx-auto mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--surface)] border border-[var(--border)] mb-6">
          <span className="w-2 h-2 rounded-full bg-[var(--primary)] animate-pulse"></span>
          <span className="text-sm text-[var(--text-secondary)]">
            Powered by Spotify + Ticketmaster
          </span>
        </div>

        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-white via-white to-[var(--primary)] bg-clip-text text-transparent">
          Discover concerts you&apos;ll actually love
        </h1>

        <p className="text-lg md:text-xl text-[var(--text-secondary)] mb-8 leading-relaxed">
          We analyze your Spotify listening history to find upcoming events
          featuring artists you already love — and ones you&apos;re about to.
        </p>

        <div className="inline-block">
          <Login />
        </div>
      </div>

      {/* How it Works */}
      <div className="w-full max-w-4xl mx-auto">
        <h2 className="text-center text-[var(--text-muted)] text-sm font-medium uppercase tracking-wider mb-8">
          How it works
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Step 1 */}
          <div className="relative p-6 rounded-xl bg-[var(--surface)] border border-[var(--border)] group hover:border-[var(--primary)]/50 transition-colors">
            <div className="absolute -top-3 left-6 px-3 py-1 rounded-full bg-[var(--primary)] text-white text-xs font-bold">
              1
            </div>
            <div className="mt-2">
              <div className="w-12 h-12 rounded-full bg-[var(--surface-hover)] flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-[var(--primary)]"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Connect Spotify
              </h3>
              <p className="text-[var(--text-secondary)] text-sm">
                Sign in with your Spotify account to let us analyze your music
                taste.
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="relative p-6 rounded-xl bg-[var(--surface)] border border-[var(--border)] group hover:border-[var(--primary)]/50 transition-colors">
            <div className="absolute -top-3 left-6 px-3 py-1 rounded-full bg-[var(--primary)] text-white text-xs font-bold">
              2
            </div>
            <div className="mt-2">
              <div className="w-12 h-12 rounded-full bg-[var(--surface-hover)] flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-[var(--primary)]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Set Your Location
              </h3>
              <p className="text-[var(--text-secondary)] text-sm">
                Tell us where you are or where you want to find events.
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="relative p-6 rounded-xl bg-[var(--surface)] border border-[var(--border)] group hover:border-[var(--primary)]/50 transition-colors">
            <div className="absolute -top-3 left-6 px-3 py-1 rounded-full bg-[var(--primary)] text-white text-xs font-bold">
              3
            </div>
            <div className="mt-2">
              <div className="w-12 h-12 rounded-full bg-[var(--surface-hover)] flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-[var(--primary)]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Get Personalized Events
              </h3>
              <p className="text-[var(--text-secondary)] text-sm">
                See concerts featuring artists matched to your taste, ranked by
                relevance.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Landing;
