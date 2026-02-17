export const OMEGAIM_ABI = [
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "player",
        "type": "address"
      }
    ],
    "name": "NewPlayer",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "player",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "bool",
        "name": "hit",
        "type": "bool"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "totalShots",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "hits",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "streak",
        "type": "uint256"
      }
    ],
    "name": "Shot",
    "type": "event"
  },
  {
    "inputs": [],
    "name": "getLeaderboardLength",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_index",
        "type": "uint256"
      }
    ],
    "name": "getPlayerAt",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_player",
        "type": "address"
      }
    ],
    "name": "getPlayerStats",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "totalShots",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "hits",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "bestStreak",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "currentStreak",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "lastShotTime",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "playerList",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "players",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "totalShots",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "hits",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "bestStreak",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "currentStreak",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "lastShotTime",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bool",
        "name": "_hit",
        "type": "bool"
      }
    ],
    "name": "shoot",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalPlayersGlobal",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalShotsGlobal",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

export const OMEGAAIM_BYTECODE = "0x608060405234801561000f575f80fd5b506108ae8061001d5f395ff3fe608060405234801561000f575f80fd5b5060043610610086575f3560e01c8063ab48660711610059578063ab48660714610116578063ae6d907314610134578063ceb73f4514610164578063e2eb41ff1461019457610086565b806330be72631461008a5780634fd66eae146100a857806366e83c49146100dc57806394074129146100fa575b5f80fd5b6100926101c8565b60405161009f91906105b5565b60405180910390f35b6100c260048036038101906100bd919061062c565b6101ce565b6040516100d3959493929190610657565b60405180910390f35b6100e461023e565b6040516100f191906105b5565b60405180910390f35b610114600480360381019061010f91906106dd565b610244565b005b61011e6104e1565b60405161012b91906105b5565b60405180910390f35b61014e60048036038101906101499190610732565b6104ed565b60405161015b919061076c565b60405180910390f35b61017e60048036038101906101799190610732565b610528565b60405161018b919061076c565b60405180910390f35b6101ae60048036038101906101a9919061062c565b61056c565b6040516101bf959493929190610657565b60405180910390f35b60035481565b5f805f805f805f808873ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020015f209050805f01548160010154826002015483600301548460040154955095509550955095505091939590929450565b60045481565b60025f3373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020015f205f9054906101000a900460ff166103a257600160025f3373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020015f205f6101000a81548160ff021916908315150217905550600133908060018154018082558091505060019003905f5260205f20015f9091909190916101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff16021790555060045f815480929190610359906107b2565b91905055503373ffffffffffffffffffffffffffffffffffffffff167f52e92d4898337244a39bd42674ac561eadfd3959e947deec1c0ab82dd58b5a7560405160405180910390a25b5f805f3373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020015f209050805f015f8154809291906103f4906107b2565b919050555042816004018190555060035f815480929190610414906107b2565b9190505550811561047457806001015f815480929190610433906107b2565b9190505550806003015f81548092919061044c906107b2565b919050555080600201548160030154111561046f57806003015481600201819055505b61047e565b5f81600301819055505b3373ffffffffffffffffffffffffffffffffffffffff167fe49182206087c250721fe3c6fa9812ac1756c4d1975b172a00f39fd48a72caf483835f0154846001015485600301546040516104d59493929190610808565b60405180910390a25050565b5f600180549050905090565b600181815481106104fc575f80fd5b905f5260205f20015f915054906101000a900473ffffffffffffffffffffffffffffffffffffffff1681565b5f6001828154811061053d5761053c61084b565b5b905f5260205f20015f9054906101000a900473ffffffffffffffffffffffffffffffffffffffff169050919050565b5f602052805f5260405f205f91509050805f0154908060010154908060020154908060030154908060040154905085565b5f819050919050565b6105af8161059d565b82525050565b5f6020820190506105c85f8301846105a6565b92915050565b5f80fd5b5f73ffffffffffffffffffffffffffffffffffffffff82169050919050565b5f6105fb826105d2565b9050919050565b61060b816105f1565b8114610615575f80fd5b50565b5f8135905061062681610602565b92915050565b5f60208284031215610641576106406105ce565b5b5f61064e84828501610618565b91505092915050565b5f60a08201905061066a5f8301886105a6565b61067760208301876105a6565b61068460408301866105a6565b61069160608301856105a6565b61069e60808301846105a6565b9695505050505050565b5f8115159050919050565b6106bc816106a8565b81146106c6575f80fd5b50565b5f813590506106d7816106b3565b92915050565b5f602082840312156106f2576106f16105ce565b5b5f6106ff848285016106c9565b91505092915050565b6107118161059d565b811461071b575f80fd5b50565b5f8135905061072c81610708565b92915050565b5f60208284031215610747576107466105ce565b5b5f6107548482850161071e565b91505092915050565b610766816105f1565b82525050565b5f60208201905061077f5f83018461075d565b92915050565b7f4e487b71000000000000000000000000000000000000000000000000000000005f52601160045260245ffd5b5f6107bc8261059d565b91507fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff82036107ee576107ed610785565b5b600182019050919050565b610802816106a8565b82525050565b5f60808201905061081b5f8301876107f9565b61082860208301866105a6565b61083560408301856105a6565b61084260608301846105a6565b95945050505050565b7f4e487b71000000000000000000000000000000000000000000000000000000005f52603260045260245ffdfea2646970667358221220af154c83bea3079712dc559af17d207afc73277634275260a38ec07cbe272f7564736f6c63430008180033";
