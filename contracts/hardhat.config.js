require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type {import('hardhat/config').HardhatUserConfig} */
module.exports = {
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      evmVersion: "paris",
    },
  },
  networks: {
    arbitrumSepolia: {
      url: process.env.ALCHEMY_URL || "",
      accounts: process.env.Arbitrum_Sepolia_private_KEY
        ? [process.env.Arbitrum_Sepolia_private_KEY]
        : [],
    },
  },
  etherscan: {
    apiKey: process.env.ARBISCAN_API_KEY || "",
  },
};