"use client";

import { useCallback, useEffect, useState } from "react";
import {
    Contract,
    JsonRpcProvider,
    ZeroAddress,
    formatUnits,
} from "ethers"; // ethers v6

import { ROUTER_ADDRESS, TOKEN_A, TOKEN_B, SEPOLIA_CHAIN_ID } from "../lib/config";
import { ERC20_ABI } from "../lib/abis";

// ---------------------------------------------------------------
// CONFIG
// ---------------------------------------------------------------

const RPC_URLS = [
    "https://ethereum-sepolia-rpc.publicnode.com",
    "https://rpc.sepolia.org",
    "https://sepolia.drpc.org",
    "https://1rpc.io/sepolia",
];

const ROUTER_FACTORY_ABI = [
    "function factory() view returns (address)",
];

const FACTORY_ABI = [
    "function getPair(address tokenA, address tokenB) view returns (address pair)",
];

const PAIR_ABI = [
    "function getReserves() view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)",
    "function token0() view returns (address)",
    "function token1() view returns (address)",
    "function totalSupply() view returns (uint256)",
];

// ---------------------------------------------------------------
// TYPES
// ---------------------------------------------------------------

type PoolData = {
    pairAddress: string;
    factoryAddress: string;
    symbol0: string;
    symbol1: string;
    reserve0: string;
    reserve1: string;
    price0in1: number;
    price1in0: number;
    lpSupply: string;
    timestamp: number;
    token0: string;
    token1: string;
};

// ---------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------

async function getWorkingProvider(): Promise<JsonRpcProvider> {
    let lastError: unknown = null;

    for (const url of RPC_URLS) {
        try {
            const provider = new JsonRpcProvider(url, Number(SEPOLIA_CHAIN_ID), {
                staticNetwork: true,
            });
            await provider.getBlockNumber();
            return provider;
        } catch (e) {
            lastError = e;
            console.warn("RPC failed:", url, e);
        }
    }

    throw lastError ?? new Error("All RPC endpoints failed");
}

async function readTokenInfo(address: string, provider: JsonRpcProvider) {
    const token = new Contract(address, ERC20_ABI, provider);

    let symbol = address.slice(0, 6) + "…";
    let decimals = 18;

    try {
        symbol = await token.symbol();
    } catch {}
    try {
        decimals = Number(await token.decimals());
    } catch {}

    return { symbol, decimals };
}

function fmt(value: string | number, digits = 6) {
    return Number(value).toLocaleString(undefined, {
        maximumFractionDigits: digits,
    });
}

// ---------------------------------------------------------------
// PAGE
// ---------------------------------------------------------------

export default function PoolPage() {
    const [data, setData] = useState<PoolData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const loadPool = useCallback(async (initial = false) => {
        try {
            if (initial) setLoading(true);
            setError("");

            const provider = await getWorkingProvider();

            // 1. Router -> Factory
            const router = new Contract(
                ROUTER_ADDRESS,
                ROUTER_FACTORY_ABI,
                provider
            );
            const factoryAddress: string = await router.factory();

            // 2. Factory -> Pair address for TOKEN_A / TOKEN_B
            const factory = new Contract(factoryAddress, FACTORY_ABI, provider);
            const pairAddress: string = await factory.getPair(TOKEN_A, TOKEN_B);

            console.log("Factory:", factoryAddress);
            console.log("Pair:", pairAddress);

            if (!pairAddress || pairAddress === ZeroAddress) {
                throw new Error(
                    "No pool exists yet for TOKEN_A / TOKEN_B. Add liquidity first, then refresh."
                );
            }

            // 3. Read the pair
            const pair = new Contract(pairAddress, PAIR_ABI, provider);

            const [reserves, token0Addr, token1Addr, lpSupplyRaw] =
                await Promise.all([
                    pair.getReserves(),
                    pair.token0(),
                    pair.token1(),
                    pair.totalSupply(),
                ]);

            const [info0, info1] = await Promise.all([
                readTokenInfo(token0Addr, provider),
                readTokenInfo(token1Addr, provider),
            ]);

            const r0 = formatUnits(reserves[0], info0.decimals);
            const r1 = formatUnits(reserves[1], info1.decimals);
            const n0 = Number(r0);
            const n1 = Number(r1);

            setData({
                pairAddress,
                factoryAddress,
                symbol0: info0.symbol,
                symbol1: info1.symbol,
                reserve0: r0,
                reserve1: r1,
                price0in1: n0 > 0 ? n1 / n0 : 0,
                price1in0: n1 > 0 ? n0 / n1 : 0,
                lpSupply: formatUnits(lpSupplyRaw, 18),
                timestamp: Number(reserves[2]),
                token0: token0Addr,
                token1: token1Addr,
            });
        } catch (err: any) {
            console.error("POOL ERROR:", err);
            setError(err?.shortMessage || err?.message || "Unable to load pool");
        } finally {
            if (initial) setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadPool(true);
        const interval = setInterval(() => loadPool(false), 15000);
        return () => clearInterval(interval);
    }, [loadPool]);

    // ----------------------- LOADING -----------------------

    if (loading) {
        return (
            <main className="min-h-[calc(100vh-72px)] bg-[#0f131d] text-[#dfe2f1] flex items-center justify-center">
                <div className="text-center">
                    <div className="w-10 h-10 mx-auto mb-4 rounded-full border-2 border-cyan-400/20 border-t-cyan-400 animate-spin" />
                    <p className="text-[#bcc9cd]">Loading pool...</p>
                </div>
            </main>
        );
    }

    // ------------------------ ERROR ------------------------

    if (error && !data) {
        return (
            <main className="min-h-[calc(100vh-72px)] bg-[#0f131d] text-[#dfe2f1] flex items-center justify-center px-4">
                <div className="w-full max-w-lg rounded-2xl bg-[#1c1f2a] border border-red-400/20 p-6">
                    <h1 className="text-xl font-bold mb-3">Pool Error</h1>
                    <p className="text-red-300 text-sm break-all">{error}</p>
                    <button
                        onClick={() => loadPool(true)}
                        className="mt-5 px-4 py-2 rounded-xl bg-cyan-400 text-[#003640] font-semibold"
                    >
                        Retry
                    </button>
                </div>
            </main>
        );
    }

    if (!data) return null;

    // ------------------------- MAIN ------------------------

    return (
        <main className="min-h-[calc(100vh-72px)] bg-[#0f131d] text-[#dfe2f1] px-4 py-10">
            <div className="max-w-5xl mx-auto">
                {/* HEADER */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-300 to-violet-400 bg-clip-text text-transparent">
                                Pool Information
                            </h1>
                            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-400/10 text-emerald-300 border border-emerald-400/20">
                                LIVE
                            </span>
                        </div>
                        <p className="text-[#87949a] text-sm">
                            {data.symbol0} / {data.symbol1} Liquidity Pool
                        </p>
                    </div>

                    <button
                        onClick={() => loadPool(false)}
                        className="px-4 py-2.5 rounded-xl border border-cyan-400/20 bg-[#1c1f2a] hover:bg-[#262a35] text-cyan-300 transition"
                    >
                        ↻ Refresh
                    </button>
                </div>

                {error && (
                    <p className="mb-5 text-sm text-amber-300">
                        Last refresh failed: {error} (showing previous data)
                    </p>
                )}

                {/* RESERVES */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                    <ReserveCard label={data.symbol0} sub="token0" value={data.reserve0} color="cyan" />
                    <ReserveCard label={data.symbol1} sub="token1" value={data.reserve1} color="violet" />
                </div>

                {/* STATS */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
                    <div className="rounded-2xl bg-[#1c1f2a]/80 border border-white/10 p-5">
                        <p className="text-xs uppercase tracking-wider text-[#87949a] mb-3">
                            Pool Price
                        </p>
                        <p className="text-lg font-mono font-bold">1 {data.symbol0}</p>
                        <p className="text-cyan-300 text-lg font-mono font-bold mt-1">
                            = {fmt(data.price0in1)} {data.symbol1}
                        </p>
                        <p className="text-xs text-[#87949a] mt-3 font-mono">
                            1 {data.symbol1} = {fmt(data.price1in0)} {data.symbol0}
                        </p>
                    </div>

                    <div className="rounded-2xl bg-[#1c1f2a]/80 border border-white/10 p-5">
                        <p className="text-xs uppercase tracking-wider text-[#87949a] mb-3">
                            LP Token Supply
                        </p>
                        <p className="text-2xl font-mono font-bold break-all">
                            {fmt(data.lpSupply, 6)}
                        </p>
                        <p className="text-xs text-[#87949a] mt-2">Total liquidity shares</p>
                    </div>

                    <div className="rounded-2xl bg-[#1c1f2a]/80 border border-white/10 p-5">
                        <p className="text-xs uppercase tracking-wider text-[#87949a] mb-3">
                            Trading Fee
                        </p>
                        <p className="text-2xl font-bold text-violet-300">0.30%</p>
                        <p className="text-xs text-[#87949a] mt-2">Per swap (V2 standard)</p>
                    </div>
                </div>

                {/* CONTRACT DETAILS */}
                <div className="rounded-2xl bg-[#1c1f2a]/80 border border-white/10 p-6">
                    <h2 className="text-lg font-bold mb-5">Contracts</h2>

                    <div className="space-y-5">
                        <AddressRow label="Pool (Pair) Address" address={data.pairAddress} />
                        <AddressRow label="Factory Address" address={data.factoryAddress} />
                        <AddressRow label={`token0 (${data.symbol0})`} address={data.token0} />
                        <AddressRow label={`token1 (${data.symbol1})`} address={data.token1} />

                        <div>
                            <p className="text-xs text-[#87949a]">Last Reserve Update</p>
                            <p className="font-mono text-sm mt-1">
                                {data.timestamp
                                    ? new Date(data.timestamp * 1000).toLocaleString()
                                    : "N/A"}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}

// ---------------------------------------------------------------
// SMALL COMPONENTS
// ---------------------------------------------------------------

function AddressRow({ label, address }: { label: string; address: string }) {
    return (
        <div>
            <p className="text-xs text-[#87949a] mb-2">{label}</p>
            <a
                href={`https://sepolia.etherscan.io/address/${address}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-300 font-mono text-sm break-all hover:underline"
            >
                {address}
            </a>
        </div>
    );
}

function ReserveCard({
    label,
    sub,
    value,
    color,
}: {
    label: string;
    sub: string;
    value: string;
    color: "cyan" | "violet";
}) {
    const styles =
        color === "cyan"
            ? {
                  border: "border-cyan-400/10",
                  badge: "bg-cyan-400/10 border-cyan-400/20 text-cyan-300",
                  text: "text-cyan-300",
              }
            : {
                  border: "border-violet-400/10",
                  badge: "bg-violet-400/10 border-violet-400/20 text-violet-300",
                  text: "text-violet-300",
              };

    return (
        <div className={`rounded-2xl bg-[#1c1f2a]/80 border ${styles.border} p-6`}>
            <div className="flex items-center gap-3 mb-5">
                <div
                    className={`w-11 h-11 rounded-full border flex items-center justify-center font-bold ${styles.badge}`}
                >
                    {label.charAt(0)}
                </div>
                <div>
                    <p className="text-lg font-bold">{label}</p>
                    <p className="text-xs text-[#87949a]">{sub}</p>
                </div>
            </div>

            <p className={`text-3xl font-mono font-bold break-all ${styles.text}`}>
                {fmt(value)}
            </p>
            <p className="text-xs text-[#87949a] mt-2">Pool Reserve</p>
        </div>
    );
}
