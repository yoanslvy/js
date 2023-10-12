import {
  ConnectUIProps,
  useConnect,
  type WalletConfig,
} from "@thirdweb-dev/react-core";
import {
  ComethConnect,
  ComethAdditionalOptions,
  walletIds,
} from "@thirdweb-dev/wallets";
import { useRef, useEffect, useState, useCallback } from "react";
import { Spinner } from "../../../components/Spinner";
import { Container } from "../../../components/basic";
import { ExclamationTriangleIcon, ReloadIcon } from "@radix-ui/react-icons";
import { iconSize, spacing } from "../../../design-system";
import { Spacer } from "../../../components/Spacer";
import { Text } from "../../../components/text";
import { Button } from "../../../components/buttons";

export const comethConnect = (
  config: Omit<ComethAdditionalOptions, "chain">,
): WalletConfig<ComethConnect> => ({
  id: walletIds.comethConnect,
  meta: {
    name: "Cometh Connect",
    iconURL:
      "data:image/svg+xml,%3Csvg width='322' height='322' viewBox='0 0 322 322' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M312.388 0.220109C269.532 3.04195 210.846 20.8328 160.384 46.2735C141.336 55.8854 127.624 64.3068 114.727 74.3376C114.44 74.5581 114.198 74.6463 114.198 74.514C114.198 74.3597 114.683 72.089 115.3 69.4435C115.895 66.798 116.403 64.5273 116.403 64.395C116.403 63.7116 93.8939 79.8931 82.2318 88.9318C32.4527 127.578 7.25447 163.799 1.34623 205.223C0.177809 213.424 -0.307196 224.689 0.199855 232.008C2.42647 263.688 16.4034 289.151 40.1245 304.759C44.3132 307.515 46.5839 308.793 50.949 310.91C71.1428 320.676 95.6576 323.74 122.906 319.948C139.176 317.678 156.019 312.828 167.548 307.096C180.401 300.702 194.047 291.399 206.459 280.619C210.03 277.488 220.921 266.62 224.007 263.093C232.01 253.922 238.447 245.258 244.157 235.976L245.656 233.551L244.466 234.654C242.878 236.153 240.652 237.696 238.624 238.754C236.397 239.901 236.066 239.878 237.169 238.556C239.594 235.668 242.482 230.267 243.496 226.739C243.804 225.659 244.025 224.755 243.981 224.711C243.959 224.667 242.923 225.328 241.732 226.188C228.284 235.668 204.122 247.44 188.073 252.312C186.684 252.731 185.516 253.04 185.472 252.996C185.427 252.952 185.846 251.871 186.375 250.593C187.412 248.146 188.911 243.692 189.44 241.488C190.123 238.71 190.255 238.798 188.117 240.518C185.979 242.237 179.674 246.47 176.918 248.035C166.843 253.745 155.137 257.647 143.298 259.235C138.933 259.83 130.181 260.072 126.169 259.698C114.308 258.617 104.74 255.244 97.0023 249.402C87.5668 242.304 81.9231 231.744 80.1154 217.855C79.6524 214.394 79.6083 206.259 80.0051 202.577C81.0192 193.252 83.2238 185.382 87.2361 176.674C96.4071 156.855 115.763 134.39 144.224 110.581C162.081 95.6337 184.303 79.5404 205.687 66.0705C234.722 47.7726 267.856 30.8195 299.492 18.055C301.674 17.1732 303.548 16.3796 303.636 16.2914C303.857 16.093 299.271 15.2993 295.303 14.8364C293.606 14.638 289.836 14.4175 286.926 14.3293L281.635 14.1971L283.288 13.6018C285.978 12.6539 315.1 2.24831 318.341 1.07989L321.317 -0.000347481L318.231 0.0216982C316.533 0.0216982 313.91 0.131926 312.388 0.220109Z' fill='white'/%3E%3C/svg%3E%0A",
  },
  create(walletOptions) {
    return new ComethConnect({
      ...walletOptions,
      ...config,
    });
  },
  connectUI: ComethConnectUI,
  isInstalled() {
    return false;
  },
});

export const ComethConnectUI = ({
  connected,
  walletConfig,
}: ConnectUIProps<ComethConnect>) => {
  const connect = useConnect();
  const [status, setStatus] = useState<"loading" | "error">("loading");
  const prompted = useRef(false);

  const connectWallet = useCallback(async () => {
    try {
      setStatus("loading");
      await connect(walletConfig);
      connected();
    } catch (e) {
      setStatus("error");
      console.error(e);
    }
  }, [connect, connected, walletConfig]);

  useEffect(() => {
    if (prompted.current) {
      return;
    }
    prompted.current = true;
    connectWallet();
  }, [connectWallet]);

  return (
    <Container flex="row" animate="fadein" fullHeight p="lg">
      <Container
        expand
        center="both"
        flex="column"
        style={{
          minHeight: "250px",
        }}
      >
        {status === "loading" && <Spinner size="xl" color="accentText" />}
        {status === "error" && (
          <Container color="danger" flex="column" center="x" animate="fadein">
            <ExclamationTriangleIcon width={iconSize.xl} height={iconSize.xl} />
            <Spacer y="md" />
            <Text color="danger">Failed to sign in</Text>
          </Container>
        )}
      </Container>

      {status === "error" && (
        <Button
          fullWidth
          variant="accent"
          onClick={connectWallet}
          style={{
            gap: spacing.sm,
          }}
        >
          <ReloadIcon width={iconSize.sm} height={iconSize.sm} />
          Try Again
        </Button>
      )}
    </Container>
  );
};
