import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { CqrsModule } from '@nestjs/cqrs';

import { Certificate } from './certificate.entity';
import { CertificateController } from './certificate.controller';
import { BlockchainPropertiesModule } from '../blockchain';
import { CertificateHandlers, InternalHandlers } from './handlers';
import { OnChainCertificateWatcher } from './listeners';
import { CertificateBatchController } from './certificate-batch.controller';
import { TransactionLog } from './transaction-log.entity';
import { TransactionLogService } from './transaction-log.service';
import { UnminedCommitment } from './unmined-commitment.entity';

@Module({
    imports: [
        CqrsModule,
        TypeOrmModule.forFeature([Certificate, TransactionLog, UnminedCommitment]),
        BlockchainPropertiesModule,
        ConfigModule
    ],
    controllers: [CertificateController, CertificateBatchController],
    providers: [
        ...CertificateHandlers,
        ...InternalHandlers,
        OnChainCertificateWatcher,
        TransactionLogService
    ],
    exports: [...CertificateHandlers, OnChainCertificateWatcher]
})
export class CertificateModule {}
