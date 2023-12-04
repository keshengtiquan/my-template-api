import { Module } from '@nestjs/common'
import { TenantService } from './tenant.service'
import { TenantController } from './tenant.controller'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Tenant } from './entities/tenant.entity'
import { Package } from '../package/entities/package.entity'
import { UserModule } from '../user/user.module'
import { User } from '../user/entities/user.entity'

@Module({
  imports: [TypeOrmModule.forFeature([Tenant, Package, User]), UserModule],
  controllers: [TenantController],
  providers: [TenantService],
})
export class TenantModule {}
