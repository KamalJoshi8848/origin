/* eslint-disable no-unused-expressions */
import { HttpStatus, INestApplication } from '@nestjs/common';
import { expect } from 'chai';
import { QueryBus } from '@nestjs/cqrs';
import moment from 'moment';
import request from 'supertest';
import { ContractTransaction } from 'ethers';
import { IClaimData } from '@energyweb/issuer';
import { DatabaseService } from '@energyweb/origin-backend-utils';
import polly from 'polly-js';

import { CertificateDTO } from '../src/pods/certificate/dto/certificate.dto';
import { CERTIFICATES_TABLE_NAME } from '../src/pods/certificate/certificate.entity';
import {
    bootstrapTestInstance,
    deviceManager,
    registryDeployer,
    TestUser,
    testUsers
} from './issuer-api';
import {
    CertificateWithLogs,
    GetCertificatesWithLogsQuery,
    GetCertificatesWithLogsResponse
} from '../src';
import { TRANSACTION_LOG_TABLE_NAME } from '../src/pods/certificate/transaction-log.entity';
import { BlockchainEventType } from '../src/pods/certificate/types';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const certificateTestData = {
    to: deviceManager.address,
    fromTime: moment().subtract(2, 'month').unix(),
    toTime: moment().subtract(1, 'month').unix(),
    energy: '1000000'
};

const claimData: IClaimData = {
    beneficiary: '1234',
    location: 'Random address 123, Somewhere',
    countryCode: 'DE',
    periodStartDate: moment('2020-01-01').toISOString(),
    periodEndDate: moment('2020-02-01').toISOString(),
    purpose: 'Some random purpose'
};

const getUserBlockchainAddress = (user: TestUser) =>
    testUsers.get(user).organization.blockchainAccountAddress;

describe('Transaction logs tests', () => {
    let app: INestApplication;
    let databaseService: DatabaseService;
    let queryBus: QueryBus;

    const createCertificate = async (toUser?: TestUser): Promise<CertificateDTO> => {
        const deviceId = `device-0x000-a`;

        const {
            body: { txHash }
        } = await request(app.getHttpServer())
            .post('/certificate')
            .set({ 'test-user': TestUser.Issuer })
            .send({
                ...certificateTestData,
                deviceId,
                to: toUser ? getUserBlockchainAddress(toUser) : certificateTestData.to
            })
            .expect(HttpStatus.OK);

        await sleep(1000);

        const { body } = await request(app.getHttpServer())
            .get(`/certificate/by-transaction/${txHash}`)
            .set({ 'test-user': TestUser.Issuer })
            .expect(HttpStatus.OK);

        return {
            ...body.pop(),
            deviceId
        };
    };

    const getCertificatesByTxHash = async (
        txHash: ContractTransaction['hash'],
        user: TestUser
    ): Promise<CertificateDTO[]> => {
        const certificates = await polly()
            .waitAndRetry(5)
            .executeForPromise(async (): Promise<CertificateDTO[]> => {
                const res = await request(app.getHttpServer())
                    .get(`/certificate/by-transaction/${txHash}`)
                    .set({ 'test-user': user });

                if (res.status !== HttpStatus.OK) {
                    throw new Error('Not mined yet');
                }
                return res.body;
            });

        return certificates;
    };

    const expectLogs = (certificate: CertificateWithLogs) => {
        const transactionTypes = certificate.transactionLogs.map((l) => l.transactionType);
        expect(transactionTypes).to.have.length(3);

        expect(transactionTypes).to.include(BlockchainEventType.IssuanceSingle);
        expect(transactionTypes).to.include(BlockchainEventType.TransferSingle);
        expect(transactionTypes).to.include(BlockchainEventType.ClaimSingle);
    };

    const expectBatchLogs = (certificate: CertificateWithLogs) => {
        const transactionTypes = certificate.transactionLogs.map((l) => l.transactionType);
        expect(transactionTypes).to.have.length(3);

        expect(transactionTypes).to.include(BlockchainEventType.IssuanceBatch);
        expect(transactionTypes).to.include(BlockchainEventType.TransferBatchMultiple);
        expect(transactionTypes).to.include(BlockchainEventType.ClaimBatchMultiple);
    };

    before(async () => {
        ({ databaseService, app, queryBus } = await bootstrapTestInstance());

        await app.init();
    });

    beforeEach(async () => {
        await databaseService.truncate(CERTIFICATES_TABLE_NAME);
        await databaseService.truncate(TRANSACTION_LOG_TABLE_NAME);
    });

    after(async () => {
        await databaseService.cleanUp();
        await app.close();
    });

    it('should create single issue, transfer and claim logs', async () => {
        const { id: certificateId, deviceId } = await createCertificate();

        await request(app.getHttpServer())
            .put(`/certificate/${certificateId}/transfer`)
            .set({ 'test-user': TestUser.OrganizationDeviceManager })
            .send({
                to: registryDeployer.address,
                amount: certificateTestData.energy
            })
            .expect(HttpStatus.OK);

        await sleep(10000);

        await request(app.getHttpServer())
            .put(`/certificate/${certificateId}/claim`)
            .set({ 'test-user': TestUser.OrganizationDeviceManager })
            .send({ claimData })
            .expect(HttpStatus.OK);

        await sleep(10000);

        const certificatesWithLogs: GetCertificatesWithLogsResponse = await queryBus.execute(
            new GetCertificatesWithLogsQuery({
                deviceIds: [deviceId],
                from: new Date(0),
                to: new Date()
            })
        );

        expect(certificatesWithLogs).to.have.length(1);
        expect(certificatesWithLogs[0].id).to.be.eq(certificateId);
        expectLogs(certificatesWithLogs[0]);
    });

    it('should create batch issue, batch transfer and batch claim logs', async () => {
        const deviceId = `device-0x000-b`;
        const {
            body: { txHash }
        } = await request(app.getHttpServer())
            .post(`/certificate-batch/issue`)
            .set({ 'test-user': TestUser.Issuer })
            .send([
                { ...certificateTestData, deviceId },
                { ...certificateTestData, deviceId }
            ])
            .expect(HttpStatus.OK);

        const certificates = await getCertificatesByTxHash(
            txHash,
            TestUser.OrganizationDeviceManager
        );

        await request(app.getHttpServer())
            .put(`/certificate-batch/transfer`)
            .set({ 'test-user': TestUser.OrganizationDeviceManager })
            .send([
                {
                    id: certificates[0].id,
                    to: getUserBlockchainAddress(TestUser.OtherOrganizationDeviceManager),
                    amount: certificateTestData.energy
                },
                {
                    id: certificates[1].id,
                    to: getUserBlockchainAddress(TestUser.OtherOrganizationDeviceManager),
                    amount: certificateTestData.energy
                }
            ])
            .expect(HttpStatus.OK);

        await sleep(10000);

        await request(app.getHttpServer())
            .put(`/certificate-batch/claim`)
            .set({ 'test-user': TestUser.OtherOrganizationDeviceManager })
            .send([
                { id: certificates[0].id, claimData, amount: certificateTestData.energy },
                { id: certificates[1].id, claimData, amount: certificateTestData.energy }
            ])
            .expect(HttpStatus.OK);

        await sleep(10000);

        const certificatesWithLogs: GetCertificatesWithLogsResponse = await queryBus.execute(
            new GetCertificatesWithLogsQuery({
                deviceIds: [deviceId],
                from: new Date(0),
                to: new Date()
            })
        );

        expect(certificatesWithLogs).to.have.length(2);

        expectBatchLogs(certificatesWithLogs[0]);
        expectBatchLogs(certificatesWithLogs[1]);
    });
});
