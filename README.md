# AnantSwap

AnantSwap is a simple decentralized exchange project for swapping two custom ERC-20 tokens on Ethereum Sepolia. The repository contains Hardhat smart contracts for `ANTA` and `ANTB`, deployment scripts, shared ethers helpers, and a Next.js frontend for wallet connection, token swaps, liquidity supply, and pool inspection.

## Features

- Deployable ERC-20 tokens:
  - `TokenA` - Anant Token A (`ANTA`)
  - `TokenB` - Anant Token B (`ANTB`)
- Sepolia-focused swap UI powered by MetaMask and ethers v6.
- Token approval and `swapExactTokensForTokens` flow through a Uniswap V2-style router.
- Add-liquidity page for the `ANTA / ANTB` pair.
- Pool page that reads factory, pair, reserves, price, and LP token supply from Sepolia.
- Hardhat 3 setup with TypeScript, ethers, OpenZeppelin contracts, and dotenv.

## Tech Stack

- Solidity `^0.8.20`
- Hardhat 3
- ethers v6
- OpenZeppelin Contracts
- Next.js 16
- React 19
- Tailwind CSS 4
- MetaMask
- Ethereum Sepolia testnet

## Project Structure

```text
contracts/        ERC-20 token contracts
scripts/          Hardhat deployment scripts
ignition/         Hardhat Ignition modules
lib/              Shared swap config, ABIs, and ethers helpers
test/             Hardhat tests
frontend/         Next.js dApp
hardhat.config.ts Hardhat networks, compiler, and plugin setup
```

## Contracts

### TokenA

`contracts/TokenA.sol` deploys `Anant Token A` with symbol `ANTA`.

- Mints `1,000,000` tokens to the deployer.
- Uses OpenZeppelin `ERC20`.
- Uses OpenZeppelin `Ownable`.
- Allows the owner to mint more tokens.

### TokenB

`contracts/TokenB.sol` deploys `Anant Token B` with symbol `ANTB`.

- Mints `1,000,000` tokens to the deployer.
- Uses OpenZeppelin `ERC20`.
- Uses OpenZeppelin `Ownable`.
- Allows the owner to mint more tokens.

## Current Sepolia Configuration

The app reads these addresses from `lib/config.ts` and `frontend/app/lib/config.ts`:

```ts
export const SEPOLIA_CHAIN_ID = 11155111;
export const ROUTER_ADDRESS = "0xeE567Fe1712Faf6149d80dA1E6934E354124CfE3";
export const TOKEN_A = "0xcD947a7a37ACb35402435Cf315C6b6933f26cEe4";
export const TOKEN_B = "0x7b150D8389b04112DB9A9951A02f8bD2Db6a0a2E";
```

If you redeploy the tokens, update both config files with the new addresses before using the frontend.

## Prerequisites

- Node.js
- npm
- MetaMask browser extension
- Sepolia ETH for gas
- Sepolia RPC URL
- A private key for deployment

## Environment Variables

Create a `.env` file in the project root:

```env
SEPOLIA_RPC_URL=your_sepolia_rpc_url
SEPOLIA_PRIVATE_KEY=your_private_key
```

Keep this file private. It is ignored by Git.

## Installation

Install the smart contract dependencies from the project root:

```bash
npm install
```

Install the frontend dependencies:

```bash
cd frontend
npm install
```

## Compile Contracts

From the project root:

```bash
npx hardhat compile
```

On Windows PowerShell, if `npx` is blocked by the execution policy, run the command through `cmd`:

```bash
cmd /c npx hardhat compile
```

## Deploy Tokens

Deploy `TokenA` and `TokenB` to Sepolia:

```bash
npx hardhat run scripts/deploy.js --network sepolia
```

The script prints the deployed token addresses:

```text
TokenA: 0x...
TokenB: 0x...
```

Copy those addresses into:

- `lib/config.ts`
- `frontend/app/lib/config.ts`

## Run the Frontend

Start the Next.js development server:

```bash
cd frontend
npm run dev
```

Open:

```text
http://localhost:3000
```

The app expects MetaMask to be connected to Ethereum Sepolia. It will request a network switch when needed.

## Frontend Pages

- `/swap` - Swap `ANTA` and `ANTB`.
- `/liquidity` - Add `ANTA / ANTB` liquidity.
- `/pool` - View live pool data such as reserves, pair address, factory address, pool price, and LP supply.

The home page renders the swap experience.

## Swap Flow

1. Connect MetaMask.
2. Enter the amount of `ANTA` or `ANTB` to swap.
3. The app gets a quote using `getAmountsOut`.
4. The app approves the router to spend the input token.
5. The app calls `swapExactTokensForTokens`.
6. The confirmed transaction hash is shown in the UI.

## Liquidity Flow

1. Open `/liquidity`.
2. Enter the amount of `ANTA` and `ANTB`.
3. The app approves both tokens for the router.
4. The app calls `addLiquidity`.
5. LP tokens are sent to the connected wallet.

## Useful Commands

Run from the project root:

```bash
npx hardhat compile
npx hardhat run scripts/deploy.js --network sepolia
```

Run from `frontend/`:

```bash
npm run dev
npm run build
npm run start
npm run lint
```

## Important Notes

- This project is configured for Sepolia testnet, not mainnet.
- The frontend uses a Uniswap V2-style router ABI.
- The router address must support the configured token pair.
- A pool must exist before swaps and pool stats work reliably.
- Test tokens have no real value.
- Never commit `.env` or private keys.

## License

ISC
