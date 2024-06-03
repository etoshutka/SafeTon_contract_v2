import { Address, toNano } from '@ton/core';
import { NftCollection } from '../wrappers/NftCollection';
import { compile, NetworkProvider } from '@ton/blueprint';
import { serealizeOffChainCollectionContent } from './content/content';

const NEXT_ITEM_INDEX = 1;
const COMMONT_CONTENT_URL: string = "https://raw.githubusercontent.com/etoshutka/metadates/main/json/"
const COLLECTION_CONTENT_URL: string = "https://raw.githubusercontent.com/etoshutka/metadates/main/collection.json"

export async function run(provider: NetworkProvider) {
    const nftCollection = provider.open(NftCollection.createFromConfig({
        ownerAddress: provider.sender().address as Address, 
        nextItemIndex: NEXT_ITEM_INDEX,
        collectionContent: serealizeOffChainCollectionContent({
            base_url: COLLECTION_CONTENT_URL,
            common_url: COMMONT_CONTENT_URL
        }),
        nftItemCode: await compile("NftItem"),
        royaltyParams: {
            royaltyFactor: Math.floor(Math.random() * 500), 
            royaltyBase: 100,
            royaltyAddress: provider.sender().address as Address
        }
    }, await compile('NftCollection')));

    await nftCollection.sendDeploy(provider.sender(), toNano('0.01'));

    await provider.waitForDeploy(nftCollection.address);
}
