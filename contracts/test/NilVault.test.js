const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Nil Protocol", function () {
  let nilToken, nilVault, nilStETH, nilLido;
  let owner, user1, user2;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    // Deploy NilStETH
    const NilStETH = await ethers.getContractFactory("NilStETH");
    nilStETH = await NilStETH.deploy();
    await nilStETH.waitForDeployment();

    // Deploy NilLido
    const NilLido = await ethers.getContractFactory("NilLido");
    nilLido = await NilLido.deploy(await nilStETH.getAddress());
    await nilLido.waitForDeployment();

    // Authorize NilLido as stETH minter
    await nilStETH.setMinter(await nilLido.getAddress());

    // Deploy NilToken
    const NilToken = await ethers.getContractFactory("NilToken");
    nilToken = await NilToken.deploy();
    await nilToken.waitForDeployment();

    // Deploy NilVault with 3 args
    const NilVault = await ethers.getContractFactory("NilVault");
    nilVault = await NilVault.deploy(
      await nilToken.getAddress(),
      await nilLido.getAddress(),
      await nilStETH.getAddress()
    );
    await nilVault.waitForDeployment();
  });

  // Test 1
  it("Should deploy NilToken successfully", async function () {
    expect(await nilToken.name()).to.equal("Nil Token");
    expect(await nilToken.symbol()).to.equal("NIL");
    expect(await nilToken.decimals()).to.equal(18);
  });

  // Test 2
  it("Should deploy NilVault with Lido references", async function () {
    expect(await nilVault.nilToken()).to.equal(await nilToken.getAddress());
    expect(await nilVault.lido()).to.equal(await nilLido.getAddress());
    expect(await nilVault.stETH()).to.equal(await nilStETH.getAddress());
    expect(await nilVault.COLLATERAL_RATIO()).to.equal(150);
    expect(await nilVault.totalETHLocked()).to.equal(0);
    expect(await nilVault.totalNILMinted()).to.equal(0);
    expect(await nilVault.totalUsers()).to.equal(0);
    expect(await nilVault.totalStETHHeld()).to.equal(0);
  });

  // Test 3
  it("Should deploy NilStETH and NilLido successfully", async function () {
    expect(await nilStETH.name()).to.equal("Staked ETH");
    expect(await nilStETH.symbol()).to.equal("stETH");
    expect(await nilStETH.minter()).to.equal(await nilLido.getAddress());
    expect(await nilLido.stETH()).to.equal(await nilStETH.getAddress());
  });

  // Test 4
  it("Should setVault and authorize NilVault on NilToken", async function () {
    const vaultAddress = await nilVault.getAddress();
    await expect(nilToken.setVault(vaultAddress))
      .to.emit(nilToken, "VaultSet")
      .withArgs(vaultAddress);
    expect(await nilToken.vault()).to.equal(vaultAddress);
  });

  describe("With vault authorized", function () {
    beforeEach(async function () {
      await nilToken.setVault(await nilVault.getAddress());
    });

    // Test 5: Deposit routes ETH through Lido and mints NIL
    it("Should deposit ETH via Lido and mint NIL", async function () {
      const depositAmount = ethers.parseEther("1.5");
      // At day 0, exchange rate = 1e18, so stETH received = 1.5 ETH
      // NIL minted = 1.5 stETH * 100 / 150 = 1.0 NIL
      const expectedNIL = ethers.parseEther("1.0");

      await nilVault.connect(user1).deposit({ value: depositAmount });

      expect(await nilToken.balanceOf(user1.address)).to.equal(expectedNIL);
      // stETH collateral should equal deposit at day 0 (rate = 1:1)
      expect(await nilStETH.balanceOf(user1.address)).to.equal(0); // stETH held by vault logic via collateral mapping
    });

    // Test 6: Collateral is stETH, depositedETH tracks raw ETH
    it("Should update collateral (stETH) and depositedETH correctly", async function () {
      const depositAmount = ethers.parseEther("1.5");
      const expectedStETH = depositAmount; // rate is 1:1 at day 0
      const expectedNIL = ethers.parseEther("1.0");

      await nilVault.connect(user1).deposit({ value: depositAmount });

      expect(await nilVault.collateral(user1.address)).to.equal(expectedStETH);
      expect(await nilVault.debt(user1.address)).to.equal(expectedNIL);
      expect(await nilVault.depositedETH(user1.address)).to.equal(depositAmount);
      expect(await nilVault.totalETHLocked()).to.equal(depositAmount);
      expect(await nilVault.totalStETHHeld()).to.equal(expectedStETH);
      expect(await nilVault.totalNILMinted()).to.equal(expectedNIL);
      expect(await nilVault.totalUsers()).to.equal(1);
    });

    // Test 7: Deposited event has 4 args (user, ethAmount, stEthReceived, nilAmount)
    it("Should emit Deposited event with stETH amount", async function () {
      const depositAmount = ethers.parseEther("1.5");
      const expectedStETH = depositAmount; // rate 1:1 at day 0
      const expectedNIL = ethers.parseEther("1.0");

      await expect(nilVault.connect(user1).deposit({ value: depositAmount }))
        .to.emit(nilVault, "Deposited")
        .withArgs(user1.address, depositAmount, expectedStETH, expectedNIL);
    });

    // Test 8
    it("Should revert deposit if msg.value is 0", async function () {
      await expect(
        nilVault.connect(user1).deposit({ value: 0 })
      ).to.be.revertedWith("Amount must be greater than 0");
    });

    // Test 9: Redeem returns stETH (not raw ETH)
    it("Should redeem NIL and return stETH", async function () {
      const depositAmount = ethers.parseEther("1.5");
      await nilVault.connect(user1).deposit({ value: depositAmount });

      const nilBalance = await nilToken.balanceOf(user1.address);
      const stETHBefore = await nilStETH.balanceOf(user1.address);

      await nilVault.connect(user1).redeem(nilBalance);

      const stETHAfter = await nilStETH.balanceOf(user1.address);

      // stETH returned = nilAmount * 150 / 100 = 1.5 stETH
      expect(stETHAfter - stETHBefore).to.equal(depositAmount);
      expect(await nilToken.balanceOf(user1.address)).to.equal(0);
      expect(await nilVault.collateral(user1.address)).to.equal(0);
      expect(await nilVault.debt(user1.address)).to.equal(0);
    });

    // Test 10: Redeemed event has 3 args (user, nilAmount, stEthReturned)
    it("Should emit Redeemed event with stETH returned", async function () {
      const depositAmount = ethers.parseEther("1.5");
      await nilVault.connect(user1).deposit({ value: depositAmount });

      const nilBalance = await nilToken.balanceOf(user1.address);
      const expectedStETHReturn = depositAmount; // 1.0 NIL * 150 / 100 = 1.5 stETH

      await expect(nilVault.connect(user1).redeem(nilBalance))
        .to.emit(nilVault, "Redeemed")
        .withArgs(user1.address, nilBalance, expectedStETHReturn);
    });

    // Test 11
    it("Should revert redeem if NIL amount exceeds debt", async function () {
      const depositAmount = ethers.parseEther("1.5");
      await nilVault.connect(user1).deposit({ value: depositAmount });

      const tooMuch = ethers.parseEther("2.0");

      await expect(
        nilVault.connect(user1).redeem(tooMuch)
      ).to.be.revertedWith("Insufficient NIL debt");
    });

    // Test 12: getPosition returns 3 values
    it("Should return position with collateral, debt, and depositedETH", async function () {
      const depositAmount = ethers.parseEther("1.5");
      await nilVault.connect(user1).deposit({ value: depositAmount });

      const [collateral, debt, depETH] = await nilVault.getPosition(user1.address);
      expect(collateral).to.equal(depositAmount);
      expect(debt).to.equal(ethers.parseEther("1.0"));
      expect(depETH).to.equal(depositAmount);
    });

    // Test 13: getStats returns 4 values
    it("Should return stats with totalStETHHeld", async function () {
      const depositAmount = ethers.parseEther("1.5");
      await nilVault.connect(user1).deposit({ value: depositAmount });

      const [ethLocked, nilMinted, users, stETHHeld] = await nilVault.getStats();
      expect(ethLocked).to.equal(depositAmount);
      expect(nilMinted).to.equal(ethers.parseEther("1.0"));
      expect(users).to.equal(1);
      expect(stETHHeld).to.equal(depositAmount);
    });

    // Test 14: getStETHValue
    it("Should return stETH value using exchange rate", async function () {
      const depositAmount = ethers.parseEther("1.5");
      await nilVault.connect(user1).deposit({ value: depositAmount });

      // At day 0 rate = 1e18, so value = collateral * 1e18 / 1e18 = collateral
      const value = await nilVault.getStETHValue(user1.address);
      expect(value).to.equal(depositAmount);
    });

    // Test 15: Multiple deposits accumulate
    it("Should accumulate multiple deposits correctly", async function () {
      await nilVault.connect(user1).deposit({ value: ethers.parseEther("1.5") });
      await nilVault.connect(user1).deposit({ value: ethers.parseEther("3.0") });

      const [collateral, debt, depETH] = await nilVault.getPosition(user1.address);
      expect(collateral).to.equal(ethers.parseEther("4.5"));
      expect(debt).to.equal(ethers.parseEther("3.0"));
      expect(depETH).to.equal(ethers.parseEther("4.5"));
      // totalUsers should still be 1
      expect(await nilVault.totalUsers()).to.equal(1);
    });

    // Test 16: Partial redeem
    it("Should handle partial redeem correctly", async function () {
      await nilVault.connect(user1).deposit({ value: ethers.parseEther("3.0") });

      // Partial redeem: 1.0 NIL out of 2.0 NIL debt
      const partialNIL = ethers.parseEther("1.0");
      await nilVault.connect(user1).redeem(partialNIL);

      const [collateral, debt] = await nilVault.getPosition(user1.address);
      // 1.0 NIL * 150 / 100 = 1.5 stETH returned
      expect(collateral).to.equal(ethers.parseEther("1.5"));
      expect(debt).to.equal(ethers.parseEther("1.0"));
      expect(await nilVault.totalUsers()).to.equal(1);
    });

    // Test 17: ETH goes to NilLido, not vault
    it("Should forward ETH to Lido, not hold it in vault", async function () {
      const depositAmount = ethers.parseEther("1.5");
      await nilVault.connect(user1).deposit({ value: depositAmount });

      const vaultETH = await ethers.provider.getBalance(await nilVault.getAddress());
      expect(vaultETH).to.equal(0);

      const lidoETH = await ethers.provider.getBalance(await nilLido.getAddress());
      expect(lidoETH).to.equal(depositAmount);
    });

    // Test 18: Multiple users
    it("Should track multiple users independently", async function () {
      await nilVault.connect(user1).deposit({ value: ethers.parseEther("1.5") });
      await nilVault.connect(user2).deposit({ value: ethers.parseEther("3.0") });

      expect(await nilVault.totalUsers()).to.equal(2);

      const [c1, d1] = await nilVault.getPosition(user1.address);
      const [c2, d2] = await nilVault.getPosition(user2.address);
      expect(c1).to.equal(ethers.parseEther("1.5"));
      expect(d1).to.equal(ethers.parseEther("1.0"));
      expect(c2).to.equal(ethers.parseEther("3.0"));
      expect(d2).to.equal(ethers.parseEther("2.0"));
    });
  });

  // Test 19
  it("Should revert if non-vault calls mint on NilToken", async function () {
    await expect(
      nilToken.connect(user1).mint(user1.address, ethers.parseEther("1.0"))
    ).to.be.revertedWith("Only vault can call");
  });

  // Test 20
  it("Should revert if non-vault calls burn on NilToken", async function () {
    await expect(
      nilToken.connect(user1).burn(user1.address, ethers.parseEther("1.0"))
    ).to.be.revertedWith("Only vault can call");
  });
});
