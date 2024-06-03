
import { Address, toNano } from '@ton/core';
import { NftCollection } from '../wrappers/NftCollection';
import { NetworkProvider } from '@ton/blueprint';

const randomSeed = Math.floor(Math.random() * 10000);

const ITEM_INDEX = 0;
const COMMON_CONTENT_URI: string = `${ITEM_INDEX}.json`;

export async function run(provider: NetworkProvider) {

    const address = Address.parse("kQDFDQXSaSW6KRt4iE-dYMj3ByuH3zQWZ-hj86FaiPoGhIlZ"); // Collection address here
    const nftCollection = provider.open(NftCollection.createFromAddress(address));

    await nftCollection.sendMintNft(provider.sender(),{
        value: toNano("0.03"),
        queryId: randomSeed,
        amount: toNano("0.015"),
        itemIndex: ITEM_INDEX,
        itemOwnerAddress: provider.sender().address as Address,
        commonContentUrl: COMMON_CONTENT_URI

    })
    console.log(`NFT Item deployed at <https://testnet.tonscan.org/address/${nftCollection.address}>`);
}