import { Module } from '@nestjs/common'
import { MenuService } from './menu.service'
import { MenuController } from './menu.controller'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Menu } from './entities/menu.entity'
import { Tenant } from '../tenant/entities/tenant.entity'

@Module({
  imports: [TypeOrmModule.forFeature([Menu, Tenant])],
  controllers: [MenuController],
  providers: [MenuService],
})
export class MenuModule {}
