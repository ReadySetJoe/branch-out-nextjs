import { SessionProvider } from "next-auth/react";
import "../styles/globals.css";

import { Session } from "next-auth";
import { AppProps } from "next/app";
import Header from "@/components/header";

export default function App({
  Component,
  pageProps: { session, ...pageProps },
}: AppProps & { pageProps: { session: Session } }) {
  return (
    <SessionProvider session={session}>
      <Header />
      <Component {...pageProps} />
    </SessionProvider>
  );
}
