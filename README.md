# Sign-in with Solana

This is a proof-of-concept composition of various "sign-in with Solana" efforts to demonstrate the viability of server-side verification of both messages and signed transactions to validate ownership of a wallet.

Primarily, this strategy can be used along with OAuth-related account management to "associate" multiple Solana wallets to an OAuth account.

## Preface

This PoC looks to accommodate for the following things:

- Signing arbitrary bytes with the Solana app on Ledger has not yet been finalized (context, context), thus signing messages alone will not suffice
- In centralized contexts, server-side verification of wallet ownership is required
- Standards like Solana Pay can be extended to handle remote signing to validate ownership

## References

Some credits and research along the way, some of which informed the strategies being used here, are being used directly in this example, or just good references for other implementations.

- Crossmint
- Web3Auth
- Jordan Sexton's proposal on Solana Pay authentication
- Ceramic
- Signing bytes with Ledger
