import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { MulterModule } from '@nestjs/platform-express';
import { UsersModule } from './users/users.module';
import { SmsService } from './sms/sms.service';
import { ProductsModule } from './products/products.module';
import { JwtAuthGuard } from './users/guards/jwt-auth.guard';
import { APP_GUARD } from '@nestjs/core';
import { RolesGuard } from './users/guards/roles.guard';
import { AbilitiesModule } from './abilities/abilities.module';
import { PoliciesGuard } from './users/guards/policies.guard';
import { CategoryModule } from './category/category.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get('MONGODB_URI'),
      }),
    }),
    MulterModule.register({
      dest: './uploads/images',
    }),
    UsersModule,
    ProductsModule,
    AbilitiesModule,
    CategoryModule,
  ],
  providers: [
    SmsService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: PoliciesGuard,
    },
  ],
})
export class AppModule {}
