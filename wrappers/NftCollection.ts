import { 
    Address, 
    beginCell, 
    Cell, 
    Contract, 
    contractAddress, 
    ContractProvider, 
    Sender, 
    SendMode,
    TupleItemInt, 
} from '@ton/core';

export type RoyaltyParams = {
    royaltyFactor: number;
    royaltyBase: number;
    royaltyAddress: Address;
};
export type NftCollectionConfig = {
    ownerAddress: Address;
    nextItemIndex: number;
    collectionContent: Cell;
    nftItemCode: Cell;
    royaltyParams: RoyaltyParams;
};

export function nftCollectionConfigToCell(config: NftCollectionConfig): Cell {
    return (
        beginCell()
            .storeAddress(config.ownerAddress)
            .storeUint(config.nextItemIndex, 64)
            .storeRef(config.collectionContent)
            .storeRef(config.nftItemCode)
            .storeRef(
                beginCell()
                    .storeUint(config.royaltyParams.royaltyFactor, 16)
                    .storeUint(config.royaltyParams.royaltyBase, 16)
                    .storeAddress(config.royaltyParams.royaltyAddress)
            )
    .endCell());
}
export class NftCollection implements Contract {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {}
    static createFromAddress(address: Address) {
        return new NftCollection(address);
    }

    static createFromConfig(config: NftCollectionConfig, code: Cell, workchain = 0) {
        const data = nftCollectionConfigToCell(config);
        const init = { code, data };
        return new NftCollection(contractAddress(workchain, init), init);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: 
                beginCell()
                .endCell(),
        });
    }

    async sendMintNft(provider: ContractProvider, via: Sender,
        opts: {
            value: bigint;
            queryId: number;
            amount: bigint;  // to send with nft
            itemIndex: number;
            itemOwnerAddress: Address;
            commonContentUrl: string
           
        }
        ) {
            const nftMessage = beginCell();
            nftMessage.storeAddress(opts.itemOwnerAddress)
            const uriContent = beginCell();
            uriContent.storeBuffer(Buffer.from(opts.commonContentUrl));
            nftMessage.storeRef(uriContent.endCell());

            
            await provider.internal(via, {
                value: opts.value,
                sendMode: SendMode.PAY_GAS_SEPARATELY,
                body: 
                    beginCell()
                        .storeUint(1, 32)  // operation
                        .storeUint(opts.queryId,64)
                        .storeUint(opts.itemIndex,64)
                        .storeCoins(opts.amount)
                        .storeRef(nftMessage)  // body
                    .endCell()
            })
    }

    async sendChangeOwner(provider: ContractProvider, via: Sender,
        opts: {
            value: bigint;
            queryId: bigint;
            newOwnerAddress: Address;
        }
        ) { 
            await provider.internal(via, {
                value: opts.value,
                sendMode: SendMode.PAY_GAS_SEPARATELY,
                body: 
                    beginCell()
                        .storeUint(3, 32) //operation
                        .storeUint(opts.queryId, 64)
                        .storeAddress(opts.newOwnerAddress)
                    .endCell()
            })
    }

    async sendChangeContent(provider: ContractProvider, via: Sender,
        opts: {
            value: bigint;
            queryId: number;
            newContent: Cell;
            newRoyaltyParams: RoyaltyParams;
        }
        ) { 
            await provider.internal(via, {
                value: opts.value,
                sendMode: SendMode.PAY_GAS_SEPARATELY,
                body: 
                    beginCell()
                        .storeUint(4, 32) //operation
                        .storeUint(opts.queryId, 64)
                        .storeRef(opts.newContent)
                        .storeRef(
                            beginCell()
                                .storeUint(opts.newRoyaltyParams.royaltyFactor, 16)
                                .storeUint(opts.newRoyaltyParams.royaltyBase, 16)
                                .storeAddress(opts.newRoyaltyParams.royaltyAddress)
                        )
                    .endCell()
            })
    }

    async getCollectionData(provider: ContractProvider): Promise<{ nextItemId: bigint, ownerAddress: Address, collectionContent: Cell }>
    {
        const collection_data = await provider.get("get_collection_data", []);
        const stack = collection_data.stack;
        let nextItem: bigint = stack.readBigNumber();
        let collectionContent = stack.readCell();
        let ownerAddress = stack.readAddress();
        return {
            nextItemId: nextItem, 
            collectionContent: collectionContent,
            ownerAddress: ownerAddress
        };
    }
    async getItemAddressByIndex(provider: ContractProvider, index: bigint): Promise<Address> {
        const res = await provider.get("get_nft_address_by_index", [
            {
                type: 'int',
                value: index
            } as TupleItemInt
        ]);
        const itemAddress = res.stack.readAddress()
        return itemAddress;
    }

    async getRoyaltyParams(provider: ContractProvider): Promise<[bigint, bigint, Address]> {
        const royalty_params = await provider.get("royalty_params", []);
        return [royalty_params.stack.readBigNumber(), royalty_params.stack.readBigNumber(), royalty_params.stack.readAddress()]
    }

    async getTokensTable(provider: ContractProvider): Promise<Cell | null> {
        const result = await provider.get("get_tonkens_table", []);
        return result.stack.readCellOpt();
    }
}