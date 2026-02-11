const hre = require("hardhat");

async function main() {
  console.log("Deploying TaskFlowEscrow to Monad Mainnet...\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deployer:", deployer.address);
  
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Balance:", hre.ethers.formatEther(balance), "MON\n");

  const TaskFlowEscrow = await hre.ethers.getContractFactory("TaskFlowEscrow");
  const escrow = await TaskFlowEscrow.deploy();

  await escrow.waitForDeployment();
  const address = await escrow.getAddress();

  console.log("✅ TaskFlowEscrow deployed to:", address);
  console.log("\nVerify on Monadscan:");
  console.log(`https://monadscan.com/address/${address}`);
  
  console.log("\n📝 Add this to your .env file:");
  console.log(`CONTRACT_ADDRESS=${address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
