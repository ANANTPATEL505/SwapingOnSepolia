"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { connectWallet } from "../lib/swap";

const navItems = [
  { href: "/swap", label: "Swap" },
  { href: "/liquidity", label: "Liquidity" },
  { href: "/history", label: "History" },
];

type WalletContextValue = {
  account: string;
  connecting: boolean;
  connect: () => Promise<string>;
};

const WalletContext = createContext<WalletContextValue | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState("");
  const [connecting, setConnecting] = useState(false);

  async function connect() {
    try {
      setConnecting(true);
      const result = await connectWallet();
      setAccount(result.address);
      return result.address;
    } catch (error) {
      console.error(error);
      throw error;
    } finally {
      setConnecting(false);
    }
  }

  const value = useMemo(
    () => ({
      account,
      connecting,
      connect,
    }),
    [account, connecting]
  );

  return (
    <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);

  if (!context) {
    throw new Error("useWallet must be used inside WalletProvider");
  }

  return context;
}

export default function Navbar() {
  const pathname = usePathname();
  const { account, connecting, connect } = useWallet();

  const shortenedAccount = account
    ? `${account.slice(0, 6)}...${account.slice(-4)}`
    : "";

  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.07] bg-[#080b12]/85 text-white backdrop-blur-xl">
      <div className="mx-auto flex min-h-[72px] w-full max-w-7xl flex-col gap-4 px-4 py-4 sm:px-5 md:flex-row md:items-center md:justify-between md:py-0">
        <Link href="/swap" className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-violet-500 shadow-lg shadow-cyan-500/20">
            <span className="text-xl font-black">A</span>
          </div>

          <div className="min-w-0">
            <div className="text-lg font-bold tracking-tight">AnantSwap</div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-gray-500">
              Decentralized Exchange
            </div>
          </div>
        </Link>

        <div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-8">
          <nav className="flex flex-wrap items-center gap-2 sm:gap-3">
            {navItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (pathname === "/" && item.href === "/swap");

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${
                    isActive
                      ? "bg-cyan-400/[0.08] text-cyan-300"
                      : "text-gray-400 hover:bg-white/[0.04] hover:text-white"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 rounded-full border border-white/[0.07] bg-white/[0.04] px-3 py-2 sm:flex">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <span className="text-xs text-gray-300">Sepolia</span>
            </div>

            <button
              type="button"
              onClick={() => {
                connect().catch(() => {});
              }}
              disabled={connecting}
              className="h-10 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 px-4 text-sm font-semibold shadow-lg shadow-cyan-500/20 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {connecting
                ? "Connecting..."
                : account
                ? shortenedAccount
                : "Connect Wallet"}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
