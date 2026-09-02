# Wallet and network

Kyros uses the injected EIP-1193 provider exposed as `window.ethereum`.

## Network configuration

| Field | Value |
| --- | --- |
| Chain name | Robinhood Chain |
| Decimal chain ID | 4663 |
| Hex chain ID | `0x1237` |
| Native currency | ETH |
| RPC | `https://rpc.mainnet.chain.robinhood.com` |
| Explorer | `https://robinhoodchain.blockscout.com` |

## Connection sequence

1. Clear any previous connection note.
2. Detect an injected provider.
3. Request `wallet_switchEthereumChain`.
4. If switching fails, request `wallet_addEthereumChain`.
5. Request accounts with `eth_requestAccounts`.
6. Display a shortened version of the first address.

## Current limitations

- No account-change or chain-change subscription
- No WalletConnect support
- No persisted connection
- No transaction signing
- No contract interaction
- No network configuration environment override

Production work should separate chain configuration from the component, add provider event handling, and present wallet errors by code rather than with one generic cancellation message.
