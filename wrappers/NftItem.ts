import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, Sender, SendMode } from '@ton/core';

export type NftItemConfig = {};

export function nftItemConfigToCell(config: NftItemConfig): Cell {
    return beginCell().endCell();
}

export class NftItem implements Contract {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {}

    static createFromAddress(address: Address) {
        return new NftItem(address);
    }

    static createFromConfig(config: NftItemConfig, code: Cell, workchain = 0) {
        const data = nftItemConfigToCell(config);
        const init = { code, data };
        return new NftItem(contractAddress(workchain, init), init);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().endCell(),
        });
    }

    // функция для отпарвки op::transfer
    async sendTransfer(provider: ContractProvider, via: Sender, 
        options: {
            queryId: number;
            value: bigint;
            newOwnerAddress: Address;
            responseAddress?: Address;
            forwardAmount?: bigint;
        }
    ) {
        await provider.internal(via, {
            value: options.value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: 
                beginCell()
                    .storeUint(0x5fcc3d14, 32)
                    .storeUint(options.queryId, 64)
                    .storeAddress(options.newOwnerAddress)
                    .storeAddress(options.responseAddress || null)
                    .storeBit(false) // no custom payload
                    .storeCoins(options.forwardAmount || 0)
                    .storeBit(false) // no forward payload
                .endCell(),
        });
    }

    // функция для изменения контента айтема с оп кодом op::edit_content()
    async sendChangeItemContent(provider: ContractProvider, via: Sender, 
        options: {
            queryId: number;
            value: bigint;
            newItemContent: Cell;
            defaultNewItemContent: Cell;
        }
    ) {
        await provider.internal(via, {
            value: options.value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: 
                beginCell()
                    .storeUint(0x1a0b9d51, 32)
                    .storeUint(options.queryId, 64)
                    .storeRef(options.newItemContent)
                    .storeRef(options.defaultNewItemContent)
                .endCell(),
        });
    }

    // get methods
    async getNftData(provider: ContractProvider): Promise<[bigint, bigint, Address, Address, Cell]> {
        const result = await provider.get("get_nft_data", []);
        
        let data: [bigint, bigint, Address, Address, Cell];
        data = [result.stack.readBigNumber(),
                result.stack.readBigNumber(),
                result.stack.readAddress(),
                result.stack.readAddress(),
                result.stack.readCell()];
        return data;
    }  

    async getDefaultAttributes(provider: ContractProvider): Promise<Cell> {
        const result = await provider.get("get_default_attributes", []);
        return result.stack.readCell();
    }  

}
