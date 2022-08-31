import {
  Header,
  Payload,
  Signature,
  SIWWeb3,
} from "@web3auth/sign-in-with-web3";
import bs58 from "bs58";
import type { NextApiRequest, NextApiResponse } from "next";

// These can be supplied by the server
const domain = "localhost";
const origin = "https://localhost:3000/api/verify-signature";
const createWeb3Message = (
  statement: string,
  nonce: string | undefined = undefined,
  issuedAt: string | undefined = undefined,
  address: string = "<address>"
) => {
  const header = new Header();
  header.t = "sip99";

  const payload = new Payload();
  payload.domain = domain;
  // This needs to be supplied by the client
  payload.address = address;
  payload.uri = origin;
  payload.statement = statement;
  payload.version = "1";
  payload.chainId = 1;

  if (nonce && issuedAt) {
    payload.nonce = nonce;
    payload.issuedAt = issuedAt;
  }

  const message = new SIWWeb3({
    header,
    payload,
    network: "solana",
  });
  return message;
};

// Utilizes the Solana Pay / auth proposal: https://twitter.com/jordaaash/status/1560386497370419200
// With Solana Pay transaction requests, there isn't (technically) a frontend to construct a well-formed message, so we'll handle it ourselves
// Extends with a message to sign
const get = (req: NextApiRequest, res: NextApiResponse) => {
  const label = "Exiled Apes Academy";
  const icon =
    "https://exiledapes.academy/wp-content/uploads/2021/09/X_share.png";

  const message = createWeb3Message(
    `Sign this message to validate ownership of this wallet`
  );

  res.status(200).send({
    label,
    icon,
    message: message.prepareMessage(),
    nonce: message.payload.nonce,
    issuedAt: message.payload.issuedAt,
  });
};

const verifyMessage = async ({
  message,
  signature,
}: {
  message: SIWWeb3;
  signature: Signature;
}) => {
  return await message.verify(message.payload, signature, message.network);
};

type PostData = {
  message: string;
  account: string;
};

// Utilizes the Solana Pay / auth proposal: https://twitter.com/jordaaash/status/1560386497370419200
const post = async (req: NextApiRequest, res: NextApiResponse<PostData>) => {
  const { body } = req;

  try {
    const { account, message, nonce, issuedAt, signature } = JSON.parse(body);

    console.info({ account, message, nonce, issuedAt, signature });
    const messageToVerify = createWeb3Message(
      `Sign this message to validate ownership of this wallet`,
      nonce,
      issuedAt,
      account
    );

    const signatureToVerify = new Signature();
    signatureToVerify.s = signature;
    signatureToVerify.t = "sip99";

    // The nonce value should likely be generated / persisted server-side, or perhaps encoded with a server-side keypair
    // For the purposes of this example we'll assume its a valid nonce that we generated

    const isVerified = await verifyMessage({
      message: messageToVerify,
      signature: signatureToVerify,
    });

    if (isVerified.success) {
      /*
       * This is where you can do some custom logic to persist the connection between the user account and this account
       * or issue a cookie or some other strategy for persisting the authentication here
       */

      return res.status(200).end();
    } else {
      return res.status(401).end();
    }
  } catch (e) {
    console.error(e);
  }
  res.status(500).end();
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<PostData>
) {
  if (req.method === "POST") {
    return await post(req, res);
  } else if (req.method === "GET") {
    return await get(req, res);
  }

  res.status(405).end();
}
