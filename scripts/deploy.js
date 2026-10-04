import { network } from "hardhat";

async function main() {
    // Create connection to the network selected by --network
    const { ethers } = await network.create();

    const [deployer] = await ethers.getSigners();

    console.log("Deploying from:", deployer.address);

    const balance = await ethers.provider.getBalance(
        deployer.address
    );

    console.log(
        "Balance:",
        ethers.formatEther(balance),
        "ETH"
    );

    // =========================
    // Deploy Token A
    // =========================

    const TokenA = await ethers.getContractFactory("TokenA");

    const tokenA = await TokenA.deploy();

    await tokenA.waitForDeployment();

    const tokenAAddress = await tokenA.getAddress();

    console.log("TokenA:", tokenAAddress);


    // =========================
    // Deploy Token B
    // =========================

    const TokenB = await ethers.getContractFactory("TokenB");

    const tokenB = await TokenB.deploy();

    await tokenB.waitForDeployment();

    const tokenBAddress = await tokenB.getAddress();

    console.log("TokenB:", tokenBAddress);


    console.log("\nDeployment complete!");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});