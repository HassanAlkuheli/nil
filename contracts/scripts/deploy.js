const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

function upsertEnvVar(content, key, value) {
  const regex = new RegExp(`${key}=.*`);
  if (content.includes(`${key}=`)) {
    return content.replace(regex, `${key}=${value}`);
  }
  return content + `${key}=${value}\n`;
}

async function main() {
  console.log("Deploying Nil Protocol to", hre.network.name, "...\n");

  // 1. Deploy NilStETH
  const NilStETH = await hre.ethers.getContractFactory("NilStETH");
  const nilStETH = await NilStETH.deploy();
  await nilStETH.waitForDeployment();
  const nilStETHAddress = await nilStETH.getAddress();
  console.log("NilStETH deployed to:", nilStETHAddress);

  // 2. Deploy NilLido
  const NilLido = await hre.ethers.getContractFactory("NilLido");
  const nilLido = await NilLido.deploy(nilStETHAddress);
  await nilLido.waitForDeployment();
  const nilLidoAddress = await nilLido.getAddress();
  console.log("NilLido deployed to:", nilLidoAddress);

  // 3. Authorize NilLido as stETH minter
  const setMinterTx = await nilStETH.setMinter(nilLidoAddress);
  await setMinterTx.wait();
  console.log("NilLido authorized as stETH minter ✓");

  // 4. Deploy NilToken
  const NilToken = await hre.ethers.getContractFactory("NilToken");
  const nilToken = await NilToken.deploy();
  await nilToken.waitForDeployment();
  const nilTokenAddress = await nilToken.getAddress();
  console.log("NilToken deployed to:", nilTokenAddress);

  // 5. Deploy NilVault (3 constructor args)
  const NilVault = await hre.ethers.getContractFactory("NilVault");
  const nilVault = await NilVault.deploy(nilTokenAddress, nilLidoAddress, nilStETHAddress);
  await nilVault.waitForDeployment();
  const nilVaultAddress = await nilVault.getAddress();
  console.log("NilVault deployed to:", nilVaultAddress);

  // 6. Authorize vault on token
  const setVaultTx = await nilToken.setVault(nilVaultAddress);
  await setVaultTx.wait();
  console.log("Vault authorized on token ✓\n");

  // 7. Write addresses to frontend .env
  const frontendEnvPath = path.join(__dirname, "..", "..", "frontend", ".env");
  const frontendEnvDir = path.dirname(frontendEnvPath);

  if (!fs.existsSync(frontendEnvDir)) {
    fs.mkdirSync(frontendEnvDir, { recursive: true });
  }

  let envContent = "";
  if (fs.existsSync(frontendEnvPath)) {
    envContent = fs.readFileSync(frontendEnvPath, "utf8");
  }

  envContent = upsertEnvVar(envContent, "VITE_VAULT_ADDRESS", nilVaultAddress);
  envContent = upsertEnvVar(envContent, "VITE_TOKEN_ADDRESS", nilTokenAddress);
  envContent = upsertEnvVar(envContent, "VITE_STETH_ADDRESS", nilStETHAddress);
  envContent = upsertEnvVar(envContent, "VITE_LIDO_ADDRESS", nilLidoAddress);

  fs.writeFileSync(frontendEnvPath, envContent);
  console.log("Frontend .env updated with all 4 contract addresses ✓");

  // 8. Write addresses to backend .env
  const backendEnvPath = path.join(__dirname, "..", "..", "backend", ".env");
  if (fs.existsSync(backendEnvPath)) {
    let backendEnv = fs.readFileSync(backendEnvPath, "utf8");
    backendEnv = upsertEnvVar(backendEnv, "VAULT_ADDRESS", nilVaultAddress);
    backendEnv = upsertEnvVar(backendEnv, "NIL_TOKEN_ADDRESS", nilTokenAddress);
    backendEnv = upsertEnvVar(backendEnv, "STETH_ADDRESS", nilStETHAddress);
    fs.writeFileSync(backendEnvPath, backendEnv);
    console.log("Backend .env updated ✓");
  }

  // 9. Copy all 4 ABIs to frontend
  const configDir = path.join(__dirname, "..", "..", "frontend", "src", "config");
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }

  const artifactPaths = [
    { contract: "NilVault", dir: "NilVault.sol" },
    { contract: "NilToken", dir: "NilToken.sol" },
    { contract: "NilStETH", dir: "staking/NilStETH.sol" },
    { contract: "NilLido", dir: "staking/NilLido.sol" },
  ];

  for (const { contract, dir } of artifactPaths) {
    const artifact = JSON.parse(
      fs.readFileSync(
        path.join(__dirname, "..", "artifacts", "contracts", dir, `${contract}.json`),
        "utf8"
      )
    );
    fs.writeFileSync(
      path.join(configDir, `${contract}.json`),
      JSON.stringify(artifact.abi, null, 2)
    );
  }
  console.log("All 4 ABIs copied to frontend/src/config/ ✓\n");

  // 10. Summary
  console.log("═══════════════════════════════════════════");
  console.log("  ∅ Nil Protocol — Deployment Complete");
  console.log("═══════════════════════════════════════════");
  console.log(`  NilStETH:  ${nilStETHAddress}`);
  console.log(`  NilLido:   ${nilLidoAddress}`);
  console.log(`  NilToken:  ${nilTokenAddress}`);
  console.log(`  NilVault:  ${nilVaultAddress}`);
  console.log(`  Network:   ${hre.network.name}`);
  console.log("═══════════════════════════════════════════\n");

  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log("Arbiscan links:");
    const base = "https://sepolia.arbiscan.io/address/";
    console.log(`  NilStETH:  ${base}${nilStETHAddress}`);
    console.log(`  NilLido:   ${base}${nilLidoAddress}`);
    console.log(`  NilToken:  ${base}${nilTokenAddress}`);
    console.log(`  NilVault:  ${base}${nilVaultAddress}\n`);

    console.log("Verify commands:");
    console.log(`  npx hardhat verify --network ${hre.network.name} ${nilStETHAddress}`);
    console.log(`  npx hardhat verify --network ${hre.network.name} ${nilLidoAddress} "${nilStETHAddress}"`);
    console.log(`  npx hardhat verify --network ${hre.network.name} ${nilTokenAddress}`);
    console.log(`  npx hardhat verify --network ${hre.network.name} ${nilVaultAddress} "${nilTokenAddress}" "${nilLidoAddress}" "${nilStETHAddress}"`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
