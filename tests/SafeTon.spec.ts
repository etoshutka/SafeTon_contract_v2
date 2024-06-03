import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { Cell, toNano } from '@ton/core';
import { SafeTon } from '../wrappers/SafeTon';
import '@ton/test-utils';
import { compile } from '@ton/blueprint';

describe('SafeTon', () => {
    let code: Cell;

    beforeAll(async () => {
        code = await compile('SafeTon');
    });

    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let safeTon: SandboxContract<SafeTon>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        safeTon = blockchain.openContract(SafeTon.createFromConfig({}, code));

        deployer = await blockchain.treasury('deployer');

        const deployResult = await safeTon.sendDeploy(deployer.getSender(), toNano('0.05'));

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: safeTon.address,
            deploy: true,
            success: true,
        });
    });

    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and safeTon are ready to use
    });
});
