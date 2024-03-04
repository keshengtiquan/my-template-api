import { Controller, Get, Post, Body, UseInterceptors, Query, DefaultValuePipe } from '@nestjs/common';
import { GanttService } from './gantt.service';
import { CreateGanttDto } from './dto/create-gantt.dto';
import { UpdateGanttDto } from './dto/update-gantt.dto';
import { Auth } from '../../sys/auth/decorators/auth.decorators';
import { UserInfo } from '../../decorators/user.dectorator';
import { User } from '../../sys/user/entities/user.entity';
import { Result } from '../../common/result';
import { UtcToLocalInterceptor } from '../../interceptor/utc2Local.interceptor';
import { generateParseIntPipe } from '../../utils';
import { Order } from '../../types';

@Controller('gantt')
export class GanttController {
  constructor(private readonly ganttService: GanttService) {}

  /**
   * 创建甘特图任务
   * @param createGanttDto
   */
  @Post('/create')
  @Auth()
  async create(@Body() createGanttDto: CreateGanttDto, @UserInfo() userInfo: User) {
    return Result.success(await this.ganttService.create(createGanttDto, userInfo));
  }

  /**
   *  获取甘特图(树形)
   */
  @Get('/getTree')
  @Auth()
  @UseInterceptors(UtcToLocalInterceptor)
  async getTree(@UserInfo() userInfo: User) {
    return Result.success(await this.ganttService.getTree(userInfo));
  }

  /**
   * 获取甘特图(列表)
   * @param userInfo
   */
  @Get('/getList')
  @Auth()
  async getAll(@UserInfo() userInfo: User) {
    return Result.success(await this.ganttService.getAll(userInfo));
  }

  /**
   * 根据ID获取单条
   * @param id
   * @param userInfo
   */
  @Get('/get')
  @Auth()
  async getOneById(@Query('id') id: string, @UserInfo() userInfo: User) {
    return Result.success(await this.ganttService.getOneById(id, userInfo));
  }

  /**
   *  更新甘特图任务
   * @param updateGanttDto
   * @param userInfo
   */
  @Post('/update')
  @Auth()
  async update(@Body() updateGanttDto: UpdateGanttDto, @UserInfo() userInfo: User) {
    return Result.success(await this.ganttService.update(updateGanttDto, userInfo));
  }

  /**
   *  删除甘特图任务
   * @param id
   * @param userInfo
   */
  @Post('/delete')
  @Auth()
  async delete(@Body('id') id: string, @UserInfo() userInfo: User) {
    return Result.success(await this.ganttService.delete(id, userInfo));
  }

  /**
   * 关联任务清单
   * @param ganttId
   * @param listIds
   * @param userInfo
   */
  @Post('/relevance/list')
  @Auth()
  async relevanceList(
    @Body('ganttId') ganttId: string,
    @Body('listIds') listIds: string[],
    @UserInfo() userInfo: User,
  ) {
    return Result.success(await this.ganttService.relevanceList(ganttId, listIds, userInfo));
  }

  /**
   * 根据甘特图的任务ID获取已关联的清单
   * @param ganttId
   * @param userInfo
   */
  @Get('/getRelevanceList')
  @Auth()
  async getRelevanceList(
    @Query('ganttId') ganttId: string,
    @Query('current', new DefaultValuePipe(1), generateParseIntPipe('current')) current: number,
    @Query('pageSize', new DefaultValuePipe(10), generateParseIntPipe('pageSize')) pageSize: number,
    @Query('sortField', new DefaultValuePipe('serialNumber')) sortField: string,
    @Query('sortOrder', new DefaultValuePipe('ASC')) sortOrder: Order,
    @UserInfo() userInfo: User,
  ) {
    return Result.success(
      await this.ganttService.getRelevanceList(ganttId, current, pageSize, sortField, sortOrder, userInfo),
    );
  }

  /**
   *  获取关联的任务ID(暂时废弃2024-01-11)
   * @param id
   * @param userInfo
   */
  @Get('/getRelevanceIds')
  @Auth()
  async getRelevanceIds(@Query('id') id: string, @UserInfo() userInfo: User) {
    return Result.success(await this.ganttService.getRelevanceIds(id, userInfo));
  }

  /**
   * 删除关联清单
   * @param id
   * @param userInfo
   */
  @Post('/deleteRelevanceList')
  @Auth()
  async deleteRelevanceList(@Body('id') id: string, @UserInfo() userInfo: User) {
    return Result.success(await this.ganttService.deleteRelevanceList(id, userInfo));
  }
}
