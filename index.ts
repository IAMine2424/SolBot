import { gql, GraphQLClient } from "graphql-request";
import * as solana from '@solana/web3.js';
import axios from 'axios';


const gqlEndpoint = `https://programs.shyft.to/v0/graphql/?api_key=4BB11BIk1AO0YwQ6`;
const rpcEndpoint = `https://rpc.shyft.to/?api_key=4BB11BIk1AO0YwQ6`

const graphQLClient = new GraphQLClient(gqlEndpoint, {
  method: `POST`,
  jsonSerializer: {
    parse: JSON.parse,
    stringify: JSON.stringify,
  },
});

const connection = new solana.Connection(rpcEndpoint);

async function queryLpMintInfo(address: string) {
  // See how we are only querying what we need
  const query = gql`
    query MyQuery ($where: Raydium_LiquidityPoolv4_bool_exp) {
  Raydium_LiquidityPoolv4(
    where: $where
  ) {
    baseMint
    lpMint
    lpReserve
  }
}`;

  const variables = {
    where: {
      pubkey: {
        _eq: address,
      },
    },
  };

  return await graphQLClient.request(query, variables);
}

/*
This is taken from Raydium's FE code
https://github.com/raydium-io/raydium-frontend/blob/572e4973656e899d04e30bfad1f528efbf79f975/src/pages/liquidity/add.tsx#L646
*/
function getBurnPercentage(lpReserve: number, actualSupply: number): number {
  const maxLpSupply = Math.max(actualSupply, (lpReserve - 1));
  const burnAmt = (maxLpSupply - actualSupply)
  return (burnAmt / maxLpSupply) * 100;
}


  const info = await queryLpMintInfo("BeuMFQpR3j1oZCNLs3nVfDRwQqdADojfEmn2dGKGUEc3") as any;
  const lpMint = info.Raydium_LiquidityPoolv4[0]?.lpMint

  //Once we have the lpMint address, we need to fetch the current token supply and decimals
  const parsedAccInfo = await connection.getParsedAccountInfo(new solana.PublicKey(lpMint));
  const mintInfo = parsedAccInfo?.value?.data?.parsed?.info

  //We divide the values based on the mint decimals
  const lpReserve = info.Raydium_LiquidityPoolv4[0].lpReserve / Math.pow(10, mintInfo?.decimals)
  const actualSupply = mintInfo?.supply / Math.pow(10, mintInfo?.decimals)

 //Calculate burn percentage
  const burnPct = getBurnPercentage(lpReserve, actualSupply)
  console.log(`${burnPct} LP burned`);

  async function getLargestAccounts(tokenAddress: string) {
    const url = 'https://rpc.shyft.to/?api_key=4BB11BIk1AO0YwQ6';
    const data = {
      jsonrpc: '2.0',
      id: 1,
      method: 'getTokenLargestAccounts',
      params: [tokenAddress]
    };
  
    try {
      const response = await axios.post(url, data);
      if (response.data.result) {
        const largestAccounts = response.data.result;
        return largestAccounts;
      } else {
        throw new Error('No result found');
      }
    } catch (error) {
      throw new Error(`Error fetching largest accounts: ${error.message}`);
    }
  }
  
  async function mintAuth(tokenAddress: string) {
      const url = 'https://rpc.shyft.to/?api_key=4BB11BIk1AO0YwQ6';
      const data = {
        jsonrpc: '2.0',
        id: 1,
        method: 'getAccountInfo',
        params: [tokenAddress, {
          "encoding": "jsonParsed"
        }]
      };
    
      try {
        const response = await axios.post(url, data);
        if (response.data.result) {
          const mint = response.data.result;
  
          return mint.value.data.parsed.info.mintAuthority;
        } else {
          throw new Error('No result found');
        }
      } catch (error) {
        throw new Error(`Error fetching minth auth : ${error.message}`);
      }
    }
  
  async function getTokenSupply(tokenAddress: string) {
    const url = 'https://rpc.shyft.to/?api_key=4BB11BIk1AO0YwQ6';
    const data = {
      jsonrpc: '2.0',
      id: 1,
      method: 'getTokenSupply',
      params: [tokenAddress]
    };
  
    try {
      const response = await axios.post(url, data);
      if (response.data.result) {
        const supply = response.data.result.value.uiAmount;
        return supply;
      } else {
        throw new Error('No result found');
      }
    } catch (error) {
      throw new Error(`Error fetching token supply: ${error.message}`);
    }
  }

  async function getPairkey(tokenAddress: string) {
    const url = 'https://rpc.shyft.to/?api_key=4BB11BIk1AO0YwQ6';
    const data = {
      jsonrpc: '2.0',
      id: 1,
      method: 'getTransaction',
      params: ["3JnV1vYdUVGLouYtFGoXJQRJ19vstkpp6qDGSVTSWoSBRuijhfH8ZEH1rfWphZzterRfhuc19WbV2v1hGdReFSit",
      {
        "maxSupportedTransactionVersion":0
        }
      ]

      
    };
  
    try {
      const response = await axios.post(url, data);
      if (response.data) {
        const pairadress = response.data.result.transaction.message.accountKeys[2];
        return pairadress;
      } else {
        throw new Error('No result found');
      }
    } catch (error) {
      throw new Error(`Error fetching token supply: ${error.message}`);
    }
  }

  
  
  // Example usage
  const tokenAddress = 'BDm9kUTvgU3BYeFNCMjnEgCAMCLwesnwMaAoW6cWGxRC';
  
  Promise.all([
    getLargestAccounts(tokenAddress),
    getTokenSupply(tokenAddress),
    mintAuth(tokenAddress),
    getPairkey(tokenAddress)
  ])
  .then(([largestAccounts, totalSupply, mintAuth, pairKey]) => {
    console.log('mint auth:', mintAuth);
  
    // Calculate the sum of the amounts of the top 10 accounts
    let sumTop10 = 0;
    for (let i = 1; i < 11; i++) {
      sumTop10 += largestAccounts.value[i].uiAmount;
    }
  
    // Calculate the percentage that the top 10 accounts hold of the total supply
    const percentageTop10 = (sumTop10 / totalSupply) * 100;
    console.log('Percentage that the top 10 accounts hold of the total supply:', percentageTop10.toFixed(2) + '%');

    console.log(JSON.stringify(pairKey))
  })
  
