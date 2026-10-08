"use client";

import { useState } from "react";
import { parseUnits } from "ethers";

import {
    TOKEN_A,
    TOKEN_B
} from "../lib/config";

import {
    getSigner,
    addLiquidity
} from "../lib/swap";


export default function LiquidityPage() {

    const [amountA, setAmountA] =
        useState("10000");

    const [amountB, setAmountB] =
        useState("10000");

    const [loading, setLoading] =
        useState(false);

    const [message, setMessage] =
        useState("");

    const [messageType, setMessageType] =
        useState<"success" | "error" | "info">("info");


    async function handleAddLiquidity() {

        try {

            if (!amountA || !amountB) {

                setMessage(
                    "Enter both token amounts."
                );

                setMessageType("error");

                return;
            }


            setLoading(true);

            setMessage(
                "Connecting wallet..."
            );

            setMessageType("info");


            const signer =
                await getSigner();


            const amountAWei =
                parseUnits(
                    amountA,
                    18
                );


            const amountBWei =
                parseUnits(
                    amountB,
                    18
                );


            setMessage(
                "Approving Token A..."
            );


            const receipt =
                await addLiquidity(
                    signer,
                    TOKEN_A,
                    TOKEN_B,
                    amountAWei,
                    amountBWei
                );


            setMessage(
                `Liquidity added successfully!\n\nTransaction:\n${receipt.hash}`
            );

            setMessageType("success");

        } catch (error: any) {

            console.error(error);

            setMessage(
                error.shortMessage ||
                error.message ||
                "Transaction failed"
            );

            setMessageType("error");

        } finally {

            setLoading(false);
        }
    }


    const ratio =
        amountA && amountB
            ? (
                Number(amountB) /
                Number(amountA)
            ).toFixed(4)
            : "—";


    return (

        <main className="min-h-[calc(100vh-72px)] bg-[#080b12] text-white overflow-hidden">

            {/* BACKGROUND */}

            <div className="fixed inset-0 pointer-events-none">

                <div className="absolute top-[-200px] right-[5%] w-[650px] h-[650px] rounded-full bg-cyan-500/10 blur-[160px]" />

                <div className="absolute bottom-[-200px] left-[5%] w-[650px] h-[650px] rounded-full bg-violet-600/10 blur-[160px]" />

                <div
                    className="absolute inset-0 opacity-[0.035]"
                    style={{
                        backgroundImage:
                            "linear-gradient(rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.5) 1px, transparent 1px)",
                        backgroundSize: "50px 50px"
                    }}
                />

            </div>


            {/* MAIN */}

            <section className="relative z-10 flex min-h-[calc(100vh-72px)] flex-col items-center px-4 py-12">

                {/* HEADER */}

                <div className="text-center mb-8">

                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-violet-400/20 bg-violet-400/[0.05] text-violet-300 text-xs font-medium mb-4">

                        <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />

                        Liquidity Pool

                    </div>


                    <h1 className="text-4xl md:text-5xl font-black tracking-tight">
                        Add Liquidity
                    </h1>


                    <p className="mt-3 text-gray-500 max-w-md">
                        Deposit ANTA and ANTB into the
                        pool and receive LP tokens.
                    </p>

                </div>


                {/* CARD */}

                <div className="w-full max-w-[480px]">

                    <div className="rounded-[28px] border border-white/[0.09] bg-white/[0.045] backdrop-blur-2xl p-5 md:p-6 shadow-2xl shadow-black/40">


                        {/* CARD HEADER */}

                        <div className="flex items-center justify-between mb-6">

                            <div>

                                <h2 className="font-bold text-lg">
                                    Supply liquidity
                                </h2>

                                <p className="text-xs text-gray-500 mt-1">
                                    ANTA / ANTB
                                </p>

                            </div>


                            <div className="px-3 py-1.5 rounded-full bg-cyan-400/[0.08] border border-cyan-400/20 text-cyan-300 text-xs font-semibold">

                                0.3% Fee

                            </div>

                        </div>


                        {/* TOKEN A */}

                        <TokenInput
                            label="Token A"
                            symbol="ANTA"
                            value={amountA}
                            onChange={setAmountA}
                            accent="cyan"
                        />


                        {/* PLUS */}

                        <div className="relative h-6">

                            <div className="absolute left-1/2 -translate-x-1/2 -top-2 w-10 h-10 rounded-xl border border-white/[0.1] bg-[#151a24] flex items-center justify-center text-cyan-300 text-lg shadow-xl">

                                +

                            </div>

                        </div>


                        {/* TOKEN B */}

                        <TokenInput
                            label="Token B"
                            symbol="ANTB"
                            value={amountB}
                            onChange={setAmountB}
                            accent="violet"
                        />


                        {/* RATIO */}

                        <div className="mt-4 rounded-2xl border border-white/[0.06] bg-black/20 p-4 space-y-3">

                            <InfoRow
                                label="Pool ratio"
                                value={`1 ANTA = ${ratio} ANTB`}
                            />

                            <InfoRow
                                label="Your deposit"
                                value={`${amountA || "0"} ANTA + ${amountB || "0"} ANTB`}
                            />

                            <InfoRow
                                label="LP tokens"
                                value={`≈ ${amountA || "0"} ANTA-ANTB LP`}
                                highlight
                            />

                        </div>


                        {/* REWARD INFO */}

                        <div className="mt-4 rounded-2xl border border-emerald-400/10 bg-emerald-400/[0.035] p-4">

                            <div className="flex items-center gap-3">

                                <div className="w-9 h-9 rounded-xl bg-emerald-400/10 flex items-center justify-center text-emerald-400">
                                    %
                                </div>

                                <div>

                                    <div className="text-sm font-semibold text-gray-200">
                                        Liquidity provider fees
                                    </div>

                                    <div className="text-xs text-gray-500 mt-1">
                                        Earn a proportional share of
                                        trading fees.
                                    </div>

                                </div>

                            </div>

                        </div>


                        {/* STATUS */}

                        {message && (

                            <div
                                className={`mt-4 rounded-xl border p-3 text-sm whitespace-pre-wrap break-all ${
                                    messageType === "success"
                                        ? "border-emerald-400/20 bg-emerald-400/[0.06] text-emerald-300"
                                        : messageType === "error"
                                        ? "border-red-400/20 bg-red-400/[0.06] text-red-300"
                                        : "border-cyan-400/20 bg-cyan-400/[0.06] text-cyan-300"
                                }`}
                            >
                                {message}
                            </div>

                        )}


                        {/* BUTTON */}

                        <button
                            onClick={handleAddLiquidity}
                            disabled={
                                loading ||
                                !amountA ||
                                !amountB
                            }
                            className="w-full mt-4 py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-violet-500 font-bold text-lg shadow-xl shadow-cyan-500/15 hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed transition"
                        >

                            {loading
                                ? "Processing..."
                                : "Supply Liquidity"}

                        </button>

                    </div>


                    {/* STATS */}

                    <div className="grid grid-cols-3 gap-3 mt-5">

                        <Stat
                            label="Fee Tier"
                            value="0.3%"
                        />

                        <Stat
                            label="Network"
                            value="Sepolia"
                        />

                        <Stat
                            label="Pair"
                            value="ANTA/ANTB"
                        />

                    </div>


                    {/* CONTRACT INFO */}

                    <div className="mt-5 rounded-2xl border border-white/[0.07] bg-white/[0.035] p-4">

                        <div className="flex items-center justify-between">

                            <div>

                                <div className="text-xs text-gray-500 uppercase tracking-wider">
                                    AMM Router
                                </div>

                                <div className="mt-1 font-mono text-xs text-gray-300">
                                    {TOKEN_A.slice(0, 8)}...
                                    {TOKEN_A.slice(-6)}
                                </div>

                            </div>

                            <span className="text-emerald-400 text-xs">
                                Sepolia
                            </span>

                        </div>

                    </div>

                </div>

            </section>

        </main>
    );
}


/* =========================
   TOKEN INPUT
========================= */

function TokenInput({
    label,
    symbol,
    value,
    onChange,
    accent
}: {
    label: string;
    symbol: string;
    value: string;
    onChange: (value: string) => void;
    accent: "cyan" | "violet";
}) {

    const cyan =
        accent === "cyan";

    return (

        <div
            className={`rounded-2xl border bg-black/20 p-4 transition ${
                cyan
                    ? "border-cyan-400/10 focus-within:border-cyan-400/40"
                    : "border-violet-400/10 focus-within:border-violet-400/40"
            }`}
        >

            <div className="flex justify-between items-center mb-3">

                <span className="text-[10px] uppercase tracking-[0.15em] text-gray-500 font-bold">
                    {label}
                </span>

                <button
                    onClick={() =>
                        onChange("10000")
                    }
                    className={`text-[10px] font-bold ${
                        cyan
                            ? "text-cyan-300"
                            : "text-violet-300"
                    }`}
                >
                    MAX
                </button>

            </div>


            <div className="flex items-center gap-3">

                <input
                    type="number"
                    min="0"
                    value={value}
                    onChange={(e) =>
                        onChange(e.target.value)
                    }
                    className="min-w-0 flex-1 bg-transparent outline-none text-3xl md:text-4xl font-mono font-semibold text-white placeholder:text-gray-700"
                />


                <div
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${
                        cyan
                            ? "bg-cyan-400/[0.06] border-cyan-400/20"
                            : "bg-violet-400/[0.06] border-violet-400/20"
                    }`}
                >

                    <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                            cyan
                                ? "bg-cyan-400/20 text-cyan-300"
                                : "bg-violet-400/20 text-violet-300"
                        }`}
                    >
                        {symbol === "ANTA"
                            ? "A"
                            : "B"}
                    </div>

                    <span className="font-bold">
                        {symbol}
                    </span>

                </div>

            </div>


            <div className="mt-3 text-xs text-gray-600">
                Sepolia ERC-20
            </div>

        </div>

    );
}


/* =========================
   INFO ROW
========================= */

function InfoRow({
    label,
    value,
    highlight
}: {
    label: string;
    value: string;
    highlight?: boolean;
}) {

    return (

        <div className="flex justify-between gap-4 text-sm">

            <span className="text-gray-500">
                {label}
            </span>

            <span
                className={
                    highlight
                        ? "text-cyan-300 font-semibold font-mono text-right"
                        : "text-gray-300 font-mono text-right"
                }
            >
                {value}
            </span>

        </div>

    );
}


/* =========================
   STAT
========================= */

function Stat({
    label,
    value
}: {
    label: string;
    value: string;
}) {

    return (

        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.035] p-4 text-center">

            <div className="text-[10px] uppercase tracking-wider text-gray-600">
                {label}
            </div>

            <div className="mt-1 text-sm font-semibold text-gray-300">
                {value}
            </div>

        </div>

    );
}
