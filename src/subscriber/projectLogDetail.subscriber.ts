import { EntitySubscriberInterface, EventSubscriber, UpdateEvent } from 'typeorm'
import { ProjectLogDetail } from '../project-log/entities/project-log-detail.entity'

@EventSubscriber()
export class ProjectLogDetailSubscriber implements EntitySubscriberInterface<ProjectLogDetail> {
  listenTo() {
    return ProjectLogDetail
  }
  beforeUpdate(event: UpdateEvent<ProjectLogDetail>): Promise<any> | void {
    const entity = event.entity
    if (entity.leftQuantities === 0 && entity.rightQuantities === 0) {
    } else {
      // 计算完成数量并更新
      entity.completionQuantity = entity.leftQuantities + entity.rightQuantities
    }
  }
}
