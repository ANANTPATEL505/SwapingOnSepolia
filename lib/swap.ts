import {
    BrowserProvider,
    Contract,
    JsonRpcSigner,
    parseUnits,
    formatUnits
} from "ethers";

import {
    ERC20_ABI,
    ROUTER_ABI
} from "./abis";

import {
    ROUTER_ADDRESS,
    SEPOLIA_CHAIN_ID
} from "./config";

declare global {
    interface Window {
        ethereum?: {
            request(args: {
                method: string;
                params?: any[];
            }): Promise<any>;
        };
    }
}

// ==========================================
// GET PROVIDER
// ==========================================

export async function getProvider() {

    if (!window.ethereum) {
        throw new Error(
            "MetaMask is not installed"
        );
    }

    const provider =
        new BrowserProvider(
            window.ethereum
        );

    return provider;
}


// ==========================================
// CONNECT WALLET
// ==========================================

export async function connectWallet() {

    if (!window.ethereum) {
        throw new Error(
            "MetaMask is not installed"
        );
    }


    // Request account

    const accounts =
        await window.ethereum.request({
            method: "eth_requestAccounts"
        });


    console.log(
        "Connected account:",
        accounts[0]
    );


    // Get actual MetaMask chain

    const chainId =
        await window.ethereum.request({
            method: "eth_chainId"
        });


    console.log(
        "Current chain:",
        chainId
    );


    // Switch if necessary

    if (
        chainId.toLowerCase() !==
        "0xaa36a7"
    ) {

        await window.ethereum.request({

            method:
                "wallet_switchEthereumChain",

            params: [
                {
                    chainId: "0xaa36a7"
                }
            ]

        });

    }


    // Create fresh provider

    const provider =
        new BrowserProvider(
            window.ethereum
        );


    const finalChain =
        await window.ethereum.request({
            method: "eth_chainId"
        });


    if (
        finalChain.toLowerCase() !==
        "0xaa36a7"
    ) {

        throw new Error(
            "Please switch MetaMask to Ethereum Sepolia"
        );
    }


    return {
        provider,
        address: accounts[0]
    };
}


// ==========================================
// GET SIGNER
// ==========================================

export async function getSigner() {

    if (!window.ethereum) {
        throw new Error(
            "MetaMask is not installed"
        );
    }

    // Get the REAL chain ID directly from MetaMask
    const chainId =
        await window.ethereum.request({
            method: "eth_chainId"
        });

    console.log(
        "MetaMask chain ID:",
        chainId
    );

    console.log(
        "Expected chain ID: 0xaa36a7"
    );


    // If not Sepolia, request switch
    if (
        chainId.toLowerCase() !==
        "0xaa36a7"
    ) {

        console.log(
            "Switching MetaMask to Sepolia..."
        );

        try {

            await window.ethereum.request({
                method:
                    "wallet_switchEthereumChain",

                params: [
                    {
                        chainId: "0xaa36a7"
                    }
                ]
            });

        } catch (error: any) {

            console.error(
                "Network switch error:",
                error
            );

            throw new Error(
                "MetaMask could not switch to Ethereum Sepolia"
            );
        }
    }


    // IMPORTANT:
    // Create a NEW provider after switching

    const provider =
        new BrowserProvider(
            window.ethereum
        );


    const finalChainId =
        await window.ethereum.request({
            method: "eth_chainId"
        });


    console.log(
        "Final MetaMask chain ID:",
        finalChainId
    );


    if (
        finalChainId.toLowerCase() !==
        "0xaa36a7"
    ) {

        throw new Error(
            `Wrong network. MetaMask chain ID is ${finalChainId}. Expected 0xaa36a7.`
        );
    }


    const signer =
        await provider.getSigner();


    console.log(
        "Connected wallet:",
        await signer.getAddress()
    );


    return signer;
}


// ==========================================
// GET TOKEN BALANCE
// ==========================================

export async function getTokenBalance(
    provider: BrowserProvider,
    tokenAddress: string,
    userAddress: string
) {

    const token =
        new Contract(
            tokenAddress,
            ERC20_ABI,
            provider
        );

    const balance =
        await token.balanceOf(
            userAddress
        );

    const decimals =
        await token.decimals();

    return formatUnits(
        balance,
        decimals
    );
}


// ==========================================
// APPROVE TOKEN
// ==========================================

export async function approveToken(
    signer: JsonRpcSigner,
    tokenAddress: string,
    amount: bigint
) {

    const token =
        new Contract(
            tokenAddress,
            ERC20_ABI,
            signer
        );

    const tx =
        await token.approve(
            ROUTER_ADDRESS,
            amount
        );

    await tx.wait();

    return tx;
}


// ==========================================
// GET SWAP QUOTE
// ==========================================

export async function getQuote(
    provider: BrowserProvider,
    tokenIn: string,
    tokenOut: string,
    amountIn: bigint
) {

    const router =
        new Contract(
            ROUTER_ADDRESS,
            ROUTER_ABI,
            provider
        );

    const path = [
        tokenIn,
        tokenOut
    ];

    const amounts =
        await router.getAmountsOut(
            amountIn,
            path
        );

    return amounts[1];
}


// ==========================================
// SLIPPAGE
// ==========================================

export function calculateMinimumOutput(
    expectedOutput: bigint,
    slippagePercent: number
) {

    const slippageBps =
        BigInt(
            Math.round(
                slippagePercent * 100
            )
        );

    return (
        expectedOutput *
        (10000n - slippageBps)
    ) / 10000n;
}


// ==========================================
// SWAP
// ==========================================

export async function swapTokens(
    signer: JsonRpcSigner,
    tokenIn: string,
    tokenOut: string,
    amountIn: bigint,
    amountOutMin: bigint
) {

    const router =
        new Contract(
            ROUTER_ADDRESS,
            ROUTER_ABI,
            signer
        );

    const deadline =
        BigInt(
            Math.floor(
                Date.now() / 1000
            ) + 600
        );

    const path = [
        tokenIn,
        tokenOut
    ];

    const userAddress =
        await signer.getAddress();

    const tx =
        await router.swapExactTokensForTokens(
            amountIn,
            amountOutMin,
            path,
            userAddress,
            deadline
        );

    const receipt =
        await tx.wait();

    return receipt;
}

export async function addLiquidity(
    signer: JsonRpcSigner,
    tokenA: string,
    tokenB: string,
    amountA: bigint,
    amountB: bigint
) {

    const tokenAContract =
        new Contract(
            tokenA,
            ERC20_ABI,
            signer
        );

    const tokenBContract =
        new Contract(
            tokenB,
            ERC20_ABI,
            signer
        );


    // ==========================
    // APPROVE TOKEN A
    // ==========================

    let tx =
        await tokenAContract.approve(
            ROUTER_ADDRESS,
            amountA
        );

    await tx.wait();


    // ==========================
    // APPROVE TOKEN B
    // ==========================

    tx =
        await tokenBContract.approve(
            ROUTER_ADDRESS,
            amountB
        );

    await tx.wait();


    // ==========================
    // ROUTER
    // ==========================

    const router =
        new Contract(
            ROUTER_ADDRESS,
            ROUTER_ABI,
            signer
        );


    // ==========================
    // DEADLINE
    // ==========================

    const deadline =
        BigInt(
            Math.floor(
                Date.now() / 1000
            ) + 600
        );


    // ==========================
    // ADD LIQUIDITY
    // ==========================

    tx =
        await router.addLiquidity(
            tokenA,
            tokenB,
            amountA,
            amountB,
            0n,
            0n,
            await signer.getAddress(),
            deadline
        );


    return tx.wait();
}