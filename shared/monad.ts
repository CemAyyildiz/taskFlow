import {
  createWalletClient,
  createPublicClient,
  http,
  parseEther,
  formatEther,
  type Hex,
} from "viem";
import { monadTestnet } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";
import type { PaymentResult } from "./types.js";

// ─── Monad Testnet Config ───────────────────────────────────────────
const getRpcUrl = (): string =>
  process.env.MONAD_RPC_URL ?? "https://testnet-rpc.monad.xyz";

// ─── Public Client (read-only, for balance checks) ──────────────────
export function getPublicClient() {
  return createPublicClient({
    chain: monadTestnet,
    transport: http(getRpcUrl()),
  });
}

// ─── Wallet Client (for signing transactions) ──────────────────────
export function getWalletClient(privateKey: Hex) {
  const account = privateKeyToAccount(privateKey);
  return createWalletClient({
    account,
    chain: monadTestnet,
    transport: http(getRpcUrl()),
  });
}

// ─── Send native MON tokens ────────────────────────────────────────
export async function sendMON(
  senderPrivateKey: Hex,
  recipientAddress: Hex,
  amountMON: string
): Promise<PaymentResult> {
  const client = getWalletClient(senderPrivateKey);
  const publicClient = getPublicClient();

  const from = client.account.address;
  console.log(`  💸 Sending ${amountMON} MON: ${from} → ${recipientAddress}`);

  // Send native MON transfer (gas limit 21000 for simple transfer)
  const hash = await client.sendTransaction({
    to: recipientAddress,
    value: parseEther(amountMON),
    gas: 21000n,
  });

  console.log(`  ⏳ Tx submitted: ${hash}`);

  // Wait for confirmation
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  console.log(
    `  ✅ Tx confirmed in block ${receipt.blockNumber} (status: ${receipt.status})`
  );

  if (receipt.status === "reverted") {
    throw new Error(`Transaction reverted: ${hash}`);
  }

  return {
    txHash: hash,
    from,
    to: recipientAddress,
    amount: amountMON,
  };
}

// ─── Check MON balance ─────────────────────────────────────────────
export async function getBalance(address: Hex): Promise<string> {
  const client = getPublicClient();
  const balance = await client.getBalance({ address });
  return formatEther(balance);
}

// ─── Derive address from private key ────────────────────────────────
export function addressFromKey(privateKey: Hex): Hex {
  return privateKeyToAccount(privateKey).address;
}
