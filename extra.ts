import axios from 'axios';

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

// Example usage
const tokenAddress = 'Hkoo9BYeiPPL2cRzwdANwZtrsdnJewJLZ4PUdRARQUwx';

Promise.all([
  getLargestAccounts(tokenAddress),
  getTokenSupply(tokenAddress),
  mintAuth(tokenAddress)
])
.then(([largestAccounts, totalSupply, mintAuth]) => {
  console.log('Top 10 largest accounts:', largestAccounts);
  console.log('Total supply:', totalSupply);
  console.log('mint auth:', mintAuth);

  // Calculate the sum of the amounts of the top 10 accounts
  let sumTop10 = 0;
  for (let i = 1; i < 11; i++) {
    sumTop10 += largestAccounts.value[i].uiAmount;
  }

  // Calculate the percentage that the top 10 accounts hold of the total supply
  const percentageTop10 = (sumTop10 / totalSupply) * 100;
  console.log('Percentage that the top 10 accounts hold of the total supply:', percentageTop10.toFixed(2) + '%');
})
.catch((error) => {
  console.error(error);
});
