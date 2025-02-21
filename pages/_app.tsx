import { SessionProvider } from "next-auth/react";
import "../styles/globals.css";

import { Session } from "next-auth";
import { AppProps } from "next/app";

export default function App({
  Component,
  pageProps: { session, ...pageProps },
}: AppProps & { pageProps: { session: Session } }) {
  return (
    <SessionProvider session={session}>
      <Component {...pageProps} />
    </SessionProvider>
  );
}
