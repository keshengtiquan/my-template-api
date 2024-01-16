import { Module } from '@nestjs/common'
import { AuthService } from './auth.service'
import { AuthController } from './auth.controller'
import { TypeOrmModule } from '@nestjs/typeorm'
import { User } from '../user/entities/user.entity'
import { JwtStrategy } from './strategy/jwt.strategy'
import { Tenant } from '../tenant/entities/tenant.entity'
@Module({
  imports: [TypeOrmModule.forFeature([User, Tenant])],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
})
export class AuthModule {}
