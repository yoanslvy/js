import type { Chain } from "@paperxyz/sdk-common-utilities";
import { ChainToPublicRpc } from "@paperxyz/sdk-common-utilities";
import type {
  ClientIdWithQuerierAndChainType,
  GetUserWalletStatusFnReturnType,
  GetUserWalletStatusRpcReturnType,
  SetUpWalletRpcReturnType,
  WalletAddressObjectType,
} from "../../interfaces/embedded-wallets/embedded-wallets";
import { UserWalletStatus } from "../../interfaces/embedded-wallets/embedded-wallets";

import { getDefaultProvider } from "ethers";
import { LocalStorage } from "../../utils/Storage/LocalStorage";
import type { EmbeddedWalletIframeCommunicator } from "../../utils/iFrameCommunication/EmbeddedWalletIframeCommunicator";
import { EthersSigner } from "./signer";

export type WalletManagementTypes = {
  createWallet: void;
  setUpNewDevice: void;
  getUserStatus: void;
};
export type WalletManagementUiTypes = {
  createWalletUi: void;
  setUpNewDeviceUi: void;
};

export type EmbeddedWalletInternalHelperType = { showUi: boolean };

export class EmbeddedWallet {
  protected clientId: string;
  protected chain: Chain;
  protected walletManagerQuerier: EmbeddedWalletIframeCommunicator<
    WalletManagementTypes & WalletManagementUiTypes
  >;
  protected localStorage: LocalStorage;

  /**
   * Not meant to be initialized directly. Call {@link .initializeUser} to get an instance
   * @param param0
   */
  constructor({ clientId, chain, querier }: ClientIdWithQuerierAndChainType) {
    this.clientId = clientId;
    this.chain = chain;
    this.walletManagerQuerier = querier;

    this.localStorage = new LocalStorage({ clientId });
  }

  /**
   * @internal
   * Used to set-up the user device in the case that they are using incognito
   * @param {string} param.deviceShareStored the value that is saved for the user's device share.
   * We save this into the localStorage on the site itself if we could not save it within the iframe's localStorage.
   * This happens in incognito mostly
   * @param {string} param.walletAddress User's wallet address
   * @param {boolean} param.isIframeStorageEnabled Tells us if we were able to store values in the localStorage in our iframe.
   * We need to store it under the dev's domain localStorage if we weren't able to store things in the iframe
   * @returns {{ walletAddress : string }} The user's wallet details
   */
  async postWalletSetUp({
    deviceShareStored,
    walletAddress,
    isIframeStorageEnabled,
    walletUserId,
  }: SetUpWalletRpcReturnType & {
    walletUserId: string;
  }): Promise<WalletAddressObjectType> {
    if (!isIframeStorageEnabled) {
      await this.localStorage.saveDeviceShare(deviceShareStored, walletUserId);
    }
    return { walletAddress };
  }

  /**
   * @internal
   * Gets the various status states of the user
   * @example
   *  const userStatus = await Paper.getUserWalletStatus();
   *  switch (userStatus.status) {
   *  case UserWalletStatus.LOGGED_OUT: {
   *    // User is logged out, call one of the auth methods on Paper.auth to authenticate the user
   *    break;
   *  }
   *  case UserWalletStatus.LOGGED_IN_WALLET_UNINITIALIZED: {
   *    // User is logged in, but does not have a wallet associated with it
   *    // you also have access to the user's details
   *    userStatus.user.authDetails;
   *    break;
   *  }
   *  case UserWalletStatus.LOGGED_IN_NEW_DEVICE: {
   *    // User is logged in and created a wallet already, but is missing the device shard
   *    // You have access to:
   *    userStatus.user.authDetails;
   *    userStatus.user.walletAddress;
   *    break;
   *  }
   *  case UserWalletStatus.LOGGED_IN_WALLET_INITIALIZED: {
   *    // user is logged in and wallet is all set up.
   *    // You have access to:
   *    userStatus.user.authDetails;
   *    userStatus.user.walletAddress;
   *    userStatus.user.wallet;
   *    break;
   *  }
   *}
   * @returns {GetUserWalletStatusFnReturnType} an object to containing various information on the user statuses
   */
  async getUserWalletStatus(): Promise<GetUserWalletStatusFnReturnType> {
    const userStatus =
      await this.walletManagerQuerier.call<GetUserWalletStatusRpcReturnType>({
        procedureName: "getUserStatus",
        params: undefined,
      });
    if (userStatus.status === UserWalletStatus.LOGGED_IN_WALLET_INITIALIZED) {
      return {
        status: UserWalletStatus.LOGGED_IN_WALLET_INITIALIZED,
        user: { ...userStatus.user, wallet: this },
      };
    }
    return userStatus;
  }

  /**
   * @description
   * Switches the chain that the user wallet is currently on.
   * @example
   * // user wallet will be set to Polygon
   * const Paper = new ThirdwebEmbeddedWalletSdk({clientId: "", chain: "Polygon"});
   * const user = await Paper.initializeUser();
   * // Switch the user wallet to Mumbai
   * await user.wallet.setChain({ chain: "Mumbai" });
   * @param {Chain} params.chain The chain that we are changing the user wallet too
   */
  async setChain({ chain }: { chain: Chain }): Promise<void> {
    this.chain = chain;
  }

  /**
   * Returns an Ethers.Js compatible signer that you can use in conjunction with the rest of dApp
   * @example
   * const Paper = new ThirdwebEmbeddedWalletSdk({clientId: "", chain: "Polygon"});
   * const user = await Paper.getUser();
   * if (user.status === UserStatus.LOGGED_IN_WALLET_INITIALIZED) {
   *    // returns a signer on the Polygon mainnet
   *    const signer = await user.getEthersJsSigner();
   *    // returns a signer on the specified RPC endpoints
   *    const signer = await user.getEthersJsSigner({rpcEndpoint: "https://eth-rpc.gateway.pokt.network"});
   * }
   * @param {Networkish} network.rpcEndpoint the rpc url where calls will be routed through
   * @throws If attempting to call the function without the user wallet initialize on their current device. This should never happen if call {@link ThirdwebEmbeddedWalletSdk.initializeUser} before accessing this function
   * @returns A signer that is compatible with Ether.js. Defaults to the public rpc on the chain specified when initializing the {@link ThirdwebEmbeddedWalletSdk} instance
   */
  async getEthersJsSigner(network?: {
    rpcEndpoint: string;
  }): Promise<EthersSigner> {
    const signer = new EthersSigner({
      clientId: this.clientId,
      provider: getDefaultProvider(
        network?.rpcEndpoint ?? ChainToPublicRpc[this.chain],
      ),
      querier: this.walletManagerQuerier,
    });
    return signer;
  }
}
