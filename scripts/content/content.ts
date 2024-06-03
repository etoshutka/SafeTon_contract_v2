import { beginCell, Cell } from '@ton/core';

function bufferToChunks(buff: Buffer, chunkSize: number) {
    const chunks: Buffer[] = [];
    while (buff.byteLength > 0) {
        chunks.push(buff.subarray(0, chunkSize));
        buff = buff.subarray(chunkSize);
    }
    return chunks;
}

function makeSnakeCell(data: Buffer): Cell {
    const chunks = bufferToChunks(data, 127);
  
    if (chunks.length === 0) {
        return beginCell().endCell();
    }
  
    if (chunks.length === 1) {
        return beginCell().storeBuffer(chunks[0]).endCell();
    }
  
    let curCell = beginCell();
  
    for (let i = chunks.length - 1; i >= 0; i--) {
        const chunk = chunks[i];
    
        curCell.storeBuffer(chunk);
    
        if (i - 1 >= 0) {
            const nextCell = beginCell();
            nextCell.storeRef(curCell);
            curCell = nextCell;
        }
    }
  
    return curCell.endCell();
}

export function encodeOffChainContent(content: string) {
    let data = Buffer.from(content);
    const offChainPrefix = Buffer.from([0x01]);
    data = Buffer.concat([offChainPrefix, data]);
    return makeSnakeCell(data);
}

export type urls = {
    common_url: string,
    base_url: string
}

export function serealizeOffChainCollectionContent(content: urls): Cell {
    const contentCell = beginCell();
    const collectionContent = encodeOffChainContent(content.base_url);
    const commonContent = beginCell();
    commonContent.storeBuffer(Buffer.from(content.common_url));
    contentCell.storeRef(collectionContent);
    contentCell.storeRef(commonContent.asCell());
    return contentCell.asCell();
}

