import { inscribe } from "./utils/inscribe";
import { Buff } from "@cmdcode/buff-utils";
import config from "./config";
import MockWallet from "./utils/mock-wallet";

const mockWallet = new MockWallet();
mockWallet.init();

const main = async () => {
  try {
    const marker = Buff.encode("ord");
    const mimetype = Buff.encode("text/plain");
    const actionType = Buff.encode("cbrc-20:deploy");
    const data = Buff.encode(
      `¤dtickd${config.tick}cmaxh${config.max}climh${config.lim}cdeca${config.dec}`
    );
    const imgdata = Buff.encode("0");

    const script = [
      mockWallet.pubkey,
      "OP_CHECKSIG",
      "OP_0",
      "OP_IF",
      marker,
      "01",
      mimetype,
      "05",
      data.slice(1),
      "07",
      actionType,
      "OP_0",
      imgdata,
      "OP_ENDIF",
    ];
    const tx = await inscribe(script);
    console.log(`Tx: ${tx}`);
  } catch (error) {
    console.error(error);
  }
};

main();
