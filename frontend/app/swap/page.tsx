"use client";

import { useEffect, useState } from "react";
import { parseUnits } from "ethers";

import {
    TOKEN_A,
    TOKEN_B
} from "../../app/lib/config";

import { useWallet } from "../components/Navbar";

import {
    getProvider,
    getSigner,
    getQuote,
    approveToken,
    swapTokens,
    calculateMinimumOutput,
    getTokenBalance
} from "../../app/lib/swap";


export default function SwapPage() {

    const { account, connect } = useWallet();

    const [fromToken, setFromToken] =
        useState<"A" | "B">("A");

    const [amountIn, setAmountIn] =
        useState("");

    const [amountOut, setAmountOut] =
        useState("");

    const [balance, setBalance] =
        useState("0");

    const [loading, setLoading] =
        useState(false);

    const [quoting, setQuoting] =
        useState(false);

    const [message, setMessage] =
        useState("");

    const [messageType, setMessageType] =
        useState<"success" | "error" | "info">("info");

    const [slippage, setSlippage] =
        useState(0.5);


    const tokenIn =
        fromToken === "A"
            ? TOKEN_A
            : TOKEN_B;

    const tokenOut =
        fromToken === "A"
            ? TOKEN_B
            : TOKEN_A;

    const fromSymbol =
        fromToken === "A"
            ? "ANTA"
            : "ANTB";

    const toSymbol =
        fromToken === "A"
            ? "ANTB"
            : "ANTA";


    // =========================
    // CONNECT WALLET
    // =========================

    async function refreshBalance() {

        if (!account) return;

        try {

            const provider =
                await getProvider();

            const newBalance =
                await getTokenBalance(
                    provider,
                    tokenIn,
                    account
                );

            setBalance(newBalance);

        } catch (error) {

            console.error(error);
        }
    }


    // =========================
    // SWITCH TOKENS
    // =========================

    async function handleSwitch() {

        setFromToken(
            previous =>
                previous === "A"
                    ? "B"
                    : "A"
        );

        setAmountIn("");
        setAmountOut("");
        setMessage("");

        if (account) {

            try {

                const provider =
                    await getProvider();

                const newFromToken =
                    fromToken === "A"
                        ? TOKEN_B
                        : TOKEN_A;

                const newBalance =
                    await getTokenBalance(
                        provider,
                        newFromToken,
                        account
                    );

                setBalance(newBalance);

            } catch (error) {

                console.error(error);
            }
        }
    }


    // =========================
    // GET QUOTE
    // =========================

    async function handleQuote() {

        try {

            if (!amountIn) {

                setAmountOut("");

                setMessage(
                    "Enter an amount first."
                );

                setMessageType("error");

                return;
            }

            setQuoting(true);
            setMessage("");

            const provider =
                await getProvider();

            const amount =
                parseUnits(
                    amountIn,
                    18
                );

            const output =
                await getQuote(
                    provider,
                    tokenIn,
                    tokenOut,
                    amount
                );

            const outputFormatted =
                Number(output) / 10 ** 18;

            setAmountOut(
                outputFormatted.toString()
            );

        } catch (error: any) {

            console.error(error);

            setMessage(
                error.shortMessage ||
                error.message ||
                "Unable to get quote"
            );

            setMessageType("error");

        } finally {

            setQuoting(false);
        }
    }


    // =========================
    // SWAP
    // =========================

    async function handleSwap() {

        try {

            if (!account) {

                setMessage("Connecting wallet...");
                setMessageType("info");

                await connect();

                return;
            }

            if (!amountIn) {

                setMessage(
                    "Enter an amount."
                );

                setMessageType("error");

                return;
            }

            setLoading(true);
            setMessage(
                "Preparing transaction..."
            );
            setMessageType("info");


            const signer =
                await getSigner();


            const amount =
                parseUnits(
                    amountIn,
                    18
                );


            // Latest quote
            setMessage(
                "Getting latest quote..."
            );

            const provider =
                await getProvider();

            const expected =
                await getQuote(
                    provider,
                    tokenIn,
                    tokenOut,
                    amount
                );


            const minimum =
                calculateMinimumOutput(
                    expected,
                    slippage
                );


            // Approval
            setMessage(
                `Approving ${fromSymbol}...`
            );

            await approveToken(
                signer,
                tokenIn,
                amount
            );


            // Swap
            setMessage(
                `Swapping ${fromSymbol} → ${toSymbol}...`
            );

            const receipt =
                await swapTokens(
                    signer,
                    tokenIn,
                    tokenOut,
                    amount,
                    minimum
                );


            setMessage(
                `Transaction confirmed!\n${receipt.hash}`
            );

            setMessageType("success");

            setAmountIn("");
            setAmountOut("");

            await refreshBalance();

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


    // =========================
    // AUTO QUOTE
    // =========================

    useEffect(() => {

        if (!amountIn) {

            setAmountOut("");
            return;
        }

        const timer =
            setTimeout(() => {

                handleQuote();

            }, 500);

        return () =>
            clearTimeout(timer);

    }, [amountIn, fromToken]);


    const formattedBalance =
        Number(balance || 0).toLocaleString(
            "en-US",
            {
                maximumFractionDigits: 4
            }
        );


    return (

        <main className="min-h-[calc(100vh-72px)] bg-[#080b12] text-white overflow-hidden">

            {/* Background */}

            <div className="fixed inset-0 pointer-events-none">

                <div className="absolute top-[-200px] right-[10%] w-[600px] h-[600px] rounded-full bg-cyan-500/10 blur-[150px]" />

                <div className="absolute bottom-[-200px] left-[10%] w-[600px] h-[600px] rounded-full bg-violet-600/10 blur-[150px]" />

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

                {/* Heading */}

                <div className="text-center mb-8">

                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-cyan-400/20 bg-cyan-400/[0.05] text-cyan-300 text-xs font-medium mb-4">

                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />

                        Ethereum Sepolia Testnet

                    </div>

                    <h1 className="text-4xl md:text-5xl font-black tracking-tight">

                        Swap tokens

                    </h1>

                    <p className="mt-3 text-gray-500 max-w-md">
                        Trade ANTA and ANTB instantly through
                        the AnantSwap AMM.
                    </p>

                </div>


                {/* SWAP CARD */}

                <div className="w-full max-w-[480px]">

                    <div className="rounded-[28px] border border-white/[0.09] bg-white/[0.045] backdrop-blur-2xl p-5 md:p-6 shadow-2xl shadow-black/40">

                        {/* Card header */}

                        <div className="flex items-center justify-between mb-5">

                            <div>

                                <h2 className="font-bold text-lg">
                                    Swap
                                </h2>

                                <p className="text-xs text-gray-500 mt-1">
                                    AMM V1 • 0.3% fee
                                </p>

                            </div>

                            <div className="flex gap-2">

                                <button
                                    onClick={handleQuote}
                                    className="w-9 h-9 rounded-xl border border-white/[0.08] bg-white/[0.04] hover:bg-white/[0.08] transition flex items-center justify-center"
                                    title="Refresh quote"
                                >
                                    ↻
                                </button>

                                <button
                                    className="w-9 h-9 rounded-xl border border-white/[0.08] bg-white/[0.04] hover:bg-white/[0.08] transition flex items-center justify-center"
                                    onClick={() =>
                                        setSlippage(
                                            slippage === 0.5
                                                ? 1
                                                : 0.5
                                        )
                                    }
                                    title="Slippage"
                                >
                                    ⚙
                                </button>

                            </div>

                        </div>


                        {/* PAY */}

                        <div className="rounded-2xl border border-white/[0.07] bg-black/20 p-4 focus-within:border-cyan-400/40 focus-within:shadow-[0_0_30px_rgba(6,182,212,.08)] transition">

                            <div className="flex justify-between items-center mb-3">

                                <span className="text-[10px] uppercase tracking-[0.15em] text-gray-500 font-bold">
                                    You Pay
                                </span>

                                {account && (

                                    <div className="text-xs text-gray-500">

                                        Balance{" "}

                                        <span className="text-gray-300">
                                            {formattedBalance}
                                        </span>

                                    </div>

                                )}

                            </div>


                            <div className="flex items-center gap-3">

                                <input
                                    type="number"
                                    min="0"
                                    placeholder="0.0"
                                    value={amountIn}
                                    onChange={(e) => {
                                        setAmountIn(e.target.value);
                                        setAmountOut("");
                                    }}
                                    className="min-w-0 flex-1 bg-transparent outline-none text-3xl md:text-4xl font-mono font-semibold placeholder:text-gray-700"
                                />


                                <div
                                    className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${
                                        fromToken === "A"
                                            ? "border-cyan-400/20 bg-cyan-400/[0.06]"
                                            : "border-violet-400/20 bg-violet-400/[0.06]"
                                    }`}
                                >

                                    <div
                                        className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                                            fromToken === "A"
                                                ? "bg-cyan-400/20 text-cyan-300"
                                                : "bg-violet-400/20 text-violet-300"
                                        }`}
                                    >
                                        {fromToken}
                                    </div>

                                    <span className="font-bold">
                                        {fromSymbol}
                                    </span>

                                </div>

                            </div>

                            <div className="mt-3 text-xs text-gray-600">
                                Sepolia ERC-20
                            </div>

                        </div>


                        {/* SWITCH */}

                        <div className="relative h-5">

                            <button
                                onClick={handleSwitch}
                                className="absolute left-1/2 -translate-x-1/2 -top-2 w-11 h-11 rounded-xl border border-white/[0.12] bg-[#151a24] hover:border-cyan-400/50 hover:text-cyan-300 transition shadow-xl flex items-center justify-center text-lg"
                            >
                                ⇅
                            </button>

                        </div>


                        {/* RECEIVE */}

                        <div className="rounded-2xl border border-white/[0.07] bg-black/20 p-4">

                            <div className="flex justify-between items-center mb-3">

                                <span className="text-[10px] uppercase tracking-[0.15em] text-gray-500 font-bold">
                                    You Receive
                                </span>

                                <span className="text-xs text-gray-600">
                                    Estimated
                                </span>

                            </div>


                            <div className="flex items-center gap-3">

                                <div className="min-w-0 flex-1 text-3xl md:text-4xl font-mono font-semibold text-cyan-300 truncate">

                                    {quoting
                                        ? "..."
                                        : amountOut || "0.0"}

                                </div>


                                <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-violet-400/20 bg-violet-400/[0.06]">

                                    <div className="w-7 h-7 rounded-full bg-violet-400/20 text-violet-300 flex items-center justify-center font-bold text-xs">
                                        {toSymbol === "ANTA"
                                            ? "A"
                                            : "B"}
                                    </div>

                                    <span className="font-bold">
                                        {toSymbol}
                                    </span>

                                </div>

                            </div>

                            <div className="mt-3 flex justify-between text-xs">

                                <span className="text-gray-600">
                                    Live AMM quote
                                </span>

                                {amountOut && (
                                    <span className="text-emerald-400">
                                        Quote available
                                    </span>
                                )}

                            </div>

                        </div>


                        {/* DETAILS */}

                        <div className="mt-4 rounded-2xl border border-white/[0.06] bg-black/20 p-4 space-y-3">

                            <div className="flex justify-between text-sm">

                                <span className="text-gray-500">
                                    Exchange rate
                                </span>

                                <span className="text-gray-200 font-mono">
                                    {amountOut && amountIn
                                        ? `1 ${fromSymbol} ≈ ${(Number(amountOut) / Number(amountIn)).toFixed(4)} ${toSymbol}`
                                        : "—"}
                                </span>

                            </div>

                            <div className="flex justify-between text-sm">

                                <span className="text-gray-500">
                                    Slippage
                                </span>

                                <button
                                    onClick={() =>
                                        setSlippage(
                                            slippage === 0.5
                                                ? 1
                                                : 0.5
                                        )
                                    }
                                    className="text-cyan-300 hover:text-cyan-200"
                                >
                                    {slippage}%
                                </button>

                            </div>

                            <div className="flex justify-between text-sm">

                                <span className="text-gray-500">
                                    Network
                                </span>

                                <span className="text-gray-300">
                                    Sepolia AMM V1
                                </span>

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


                        {/* ACTION */}

                        <button
                            onClick={handleSwap}
                            disabled={
                                loading ||
                                !amountIn
                            }
                            className="w-full mt-4 py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-violet-500 font-bold text-lg shadow-xl shadow-cyan-500/15 hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed transition"
                        >

                            {loading
                                ? "Processing..."
                                : !account
                                ? "Connect Wallet"
                                : !amountIn
                                ? "Enter Amount"
                                : "Swap Tokens"}

                        </button>

                    </div>


                    {/* STATS */}

                    <div className="grid grid-cols-3 gap-3 mt-5">

                        <Stat
                            label="Network"
                            value="Sepolia"
                        />

                        <Stat
                            label="Fee"
                            value="0.3%"
                        />

                        <Stat
                            label="Slippage"
                            value={`${slippage}%`}
                        />

                    </div>

                </div>

            </section>

        </main>
    );
}


/* =========================
   STAT COMPONENT
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
