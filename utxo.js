const bitcoin = require('bitcoinjs-lib');
const bip32 = require('bip32');
// const ECPair = require('ecpair');
const axios = require('axios'); // Used for API requests to fetch UTXOs

const {ECPair} = require('bitcoinjs-lib');
// Replace with your actual Bitcoin network
const NETWORK = bitcoin.networks.testnet; 
// Use 'bitcoin.networks.bitcoin' for mainnet

// Replace with your actual private key
const privateKey = ECPair.fromWIF('tb1q5mjjaw0dxw26v5eh2dq7x44anvdwe80j3ywd3d', NETWORK);

// Define helper function to fetch UTXOs from an API service
const fetchUTXOs = async (address) => {
    const url = `<YOUR_API_SERVICE_URL>/address/${address}/utxo`;
    const response = await axios.get(url);
    return response.data;
};

// Define helper function to build and sign the transaction
const createTransaction = async () => {
    const { address } = bitcoin.payments.p2wpkh({ pubkey: privateKey.publicKey, network: NETWORK });
    
    // Fetch UTXOs for the provided address
    const utxos = await fetchUTXOs(address);

    // Sort UTXOs by amount in descending order
    utxos.sort((a, b) => b.value - a.value);

    // We select the largest UTXO
    const largestUTXO = utxos[0];

    // Create a new transaction builder
    const txb = new bitcoin.TransactionBuilder(NETWORK);

    // Add the input UTXO to the transaction
    txb.addInput(largestUTXO.txid, largestUTXO.vout);

    // Constant for 546 satoshis
    const satoshis546 = 546;

    // Calculate the number of outputs based on the UTXO value, ensuring enough remains for the fee
    // This assumes a fixed fee, you should calculate this dynamically
    const fee = 10000;
    const numberOfOutputs = Math.floor((largestUTXO.value - fee) / satoshis546);

    if (numberOfOutputs < 1) {
        throw new Error('Not enough funds to split UTXO into pieces of 546 satoshis after fees.');
    }

    // Add all the outputs to the transaction
    for (let i = 0; i < numberOfOutputs; i++) {
        txb.addOutput(address, satoshis546);
    }

    // Sign the transaction with the private key of the input UTXO
    txb.sign(0, privateKey);

    // Build the transaction
    const tx = txb.build();

    // Return the transaction in hexadecimal format ready to be broadcasted
    return tx.toHex();
};

// Function to broadcast the transaction
const broadcastTransaction = async (txHex) => {
    const url = `<BITCOIN_NODE_RPC_URL>`;

    // Depending on your setup you may need to include credentials or other headers for RPC calls
    const response = await axios.post(url, {
        jsonrpc: "1.0",
        id: "curltext",
        method: "sendrawtransaction",
        params: [txHex]
    });

    return response.data;
};

// Finally, create the transaction and broadcast it
createTransaction()
    .then(txHex => broadcastTransaction(txHex))
    .then(result => console.log('Transaction ID:', result))
    .catch(err => console.log(err));
