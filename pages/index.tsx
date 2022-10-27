import {
  useConnection,
  useWallet,
  WalletContextState,
} from "@solana/wallet-adapter-react";
import { WalletDisconnectButton } from "@solana/wallet-adapter-react-ui";
import React, { useState } from "react";
import styles from "../public/css/solana.module.css";
import SolanaLogo from "../public/solanaLogoMark.png";
import Image from "next/image";
import bs58 from "bs58";
import { useMutation, useQuery } from "react-query";
import dynamic from "next/dynamic";

const WalletMultiButtonDynamic = dynamic(
  async () =>
    (await import("@solana/wallet-adapter-react-ui")).WalletMultiButton,
  { ssr: false }
);

const getMessageToVerify = async (
  publicKey: string
): Promise<{
  message: string;
  nonce: string;
  issuedAt: string;
}> => {
  const { message, nonce, issuedAt } = await (
    await fetch("/api/verify-signature", { method: "GET" })
  ).json();

  const messageWithAccount = message.replace("<address>", publicKey);

  return { message: messageWithAccount, nonce, issuedAt };
};

const verifySignature = async ({
  account,
  message,
  nonce,
  issuedAt,
  signature,
}: {
  account: string;
  message: string;
  nonce: string;
  issuedAt: string;
  signature: string;
}) => {
  return await (
    await fetch("/api/verify-signature", {
      method: "POST",
      body: JSON.stringify({
        account,
        message,
        nonce,
        issuedAt,
        signature,
      }),
    })
  ).json();
};

const verifyWalletOwnership = async (wallet: WalletContextState) => {
  const { message, nonce, issuedAt } = await getMessageToVerify(
    wallet.publicKey!.toBase58()
  );
  const signature = bs58.encode(
    await wallet.signMessage!(new TextEncoder().encode(message))
  );
  await verifySignature({
    account: wallet.publicKey!.toBase58(),
    message,
    nonce,
    issuedAt,
    signature,
  });
};

const VerifyWalletOwnershipButton: React.FC = () => {
  const wallet = useWallet();

  const { mutate, isLoading } = useMutation(verifyWalletOwnership, {
    onSuccess: (data) => {
      console.log({ data });
    },
    onError: (data) => {
      console.error({ data });
    },
  });

  return <button onClick={async () => mutate(wallet)}>Click me!</button>;
};

const Solana: React.FC = () => {
  const { connection } = useConnection();

  let walletAddress = "";
  const wallet = useWallet();
  if (wallet.connected && wallet.publicKey) {
    walletAddress = wallet.publicKey.toString();
  }

  const [sign, setSignature] = useState("");

  return (
    <>
      {wallet.connected && sign == "" && (
        <span>
          <p className={styles.center}>Sign Transaction</p>
          <input
            className={styles.publicKey}
            type="text"
            id="publicKey"
            value={walletAddress}
          />
        </span>
      )}
      {wallet.connected != true && sign == "" && (
        <div>
          <div className={styles.logowrapper}>
            <Image alt="" className={styles.solanalogo} src={SolanaLogo} />
          </div>
          <p className={styles.sign}>Sign in With Solana</p>
        </div>
      )}

      {wallet.connected && sign == "" && (
        <div>
          <VerifyWalletOwnershipButton />
          <WalletDisconnectButton className={styles.walletButton} />
        </div>
      )}
      {wallet.connected != true && sign == "" && (
        <WalletMultiButtonDynamic className={styles.walletButton} />
      )}
    </>
  );
};

export default Solana;
