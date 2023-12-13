import { EventSubscriber, EntitySubscriberInterface, InsertEvent } from 'typeorm'
import { snowFlake } from './snow.flake'

@EventSubscriber()
export class GeneralEntitySubscriber implements EntitySubscriberInterface<any> {
  beforeInsert(event: InsertEvent<any>) {
    // 可以修改实体属性等操作
    if (event.entity && !event.entity.id) {
      event.entity.id = snowFlake.nextId()
    }
  }
}
