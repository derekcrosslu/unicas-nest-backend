import { Module } from '@nestjs/common';
import { MembersController } from './members.controller';
import { JuntasModule } from '../juntas/juntas.module';

@Module({
  imports: [JuntasModule],
  controllers: [MembersController],
})
export class MembersModule {}
