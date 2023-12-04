import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from './sys/auth/auth.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from './sys/user/user.module';
import { GeneralEntitySubscriber } from './utils/typeorm-event-subscriber';
import { JwtModule } from '@nestjs/jwt';
import { RoleModule } from './sys/role/role.module';
import { PackageModule } from './sys/package/package.module';
import { MenuModule } from './sys/menu/menu.module';
import { TenantModule } from './sys/tenant/tenant.module';

@Module({
  imports: [
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
        };
      },
      inject: [ConfigService],
    }),
    JwtModule.registerAsync({
      global: true,
      useFactory(configService: ConfigService) {
        return {
          secret: configService.get('jwt_secret'),
          signOptions: {
            expiresIn: '30m', // 默认 30 分钟
          },
        };
      },
      inject: [ConfigService],
    }),
    AuthModule,
    UserModule,
    RoleModule,
    PackageModule,
    MenuModule,
    TenantModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}