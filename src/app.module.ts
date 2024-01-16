import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { AuthModule } from './sys/auth/auth.module'
import { TypeOrmModule } from '@nestjs/typeorm'
import { UserModule } from './sys/user/user.module'
import { GeneralEntitySubscriber } from './utils/typeorm-event-subscriber'
import { JwtModule } from '@nestjs/jwt'
import { RoleModule } from './sys/role/role.module'
import { PackageModule } from './sys/package/package.module'
import { MenuModule } from './sys/menu/menu.module'
import { TenantModule } from './sys/tenant/tenant.module'
import { DeptModule } from './sys/dept/dept.module'
import { ListModule } from './resource/list/list.module'
import { ExcelController } from './excel/excel.controller'
import { ExcelModule } from './excel/excel.module'
import { WorkplaceModule } from './resource/workplace/workplace.module'
import { DivisionModule } from './resource/division/division.module'
import { SectionDivisionModule } from './resource/section-division/section-division.module'
import { MyLoggerService } from './common/my-logger/my-logger.service'
import { MyLoggerModule } from './common/my-logger/my-logger.module';
import { GanttModule } from './plan/gantt/gantt.module';
import { IssuedModule } from './plan/issued/issued.module';
import { ProjectLogModule } from './project-log/project-log.module';
import { ScheduleModule } from '@nestjs/schedule'
import { TaskModule } from './task/task.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: 'src/.env',
    }),
    TypeOrmModule.forRootAsync({
      useFactory(configService: ConfigService) {
        return {
          type: 'mysql',
          host: configService.get('mysql_server_host'),
          port: configService.get('mysql_server_port'),
          username: configService.get('mysql_server_username'),
          password: configService.get('mysql_server_password'),
          database: configService.get('mysql_server_database'),
          synchronize: true,
          logging: true,
          entities: [__dirname + '/**/*.entity{.ts,.js}'],
          poolSize: 10,
          connectorPackage: 'mysql2',
          extra: {
            authPlugin: 'sha256_password',
          },
          subscribers: [GeneralEntitySubscriber],
        }
      },
      inject: [ConfigService],
    }),
    JwtModule.registerAsync({
      global: true,
      useFactory(configService: ConfigService) {
        return {
          secret: configService.get('jwt_secret'),
          signOptions: {
            expiresIn: '1d', // 默认 30 分钟
          },
        }
      },
      inject: [ConfigService],
    }),
    AuthModule,
    UserModule,
    RoleModule,
    PackageModule,
    MenuModule,
    TenantModule,
    DeptModule,
    ListModule,
    ExcelModule,
    WorkplaceModule,
    DivisionModule,
    SectionDivisionModule,
    MyLoggerModule,
    GanttModule,
    IssuedModule,
    ProjectLogModule,
    TaskModule,
  ],
  controllers: [ExcelController],
  providers: [MyLoggerService],
})
export class AppModule {}
