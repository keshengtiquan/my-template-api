import { Controller, Post, Body, Get, Query, DefaultValuePipe, UseInterceptors, UploadedFile } from '@nestjs/common'
import { WorkplaceService } from './workplace.service'
import { CreateWorkplaceDto } from './dto/create-workplace.dto'
import { Auth } from '../../sys/auth/decorators/auth.decorators'
import { Result } from '../../common/result'
import { UserInfo } from '../../decorators/user.dectorator'
import { User } from '../../sys/user/entities/user.entity'
import { generateParseIntPipe } from '../../utils'
import { Order } from '../../types'
import { WorkPlaceType } from './entities/workplace.entity'
import { UtcToLocalInterceptor } from '../../interceptor/utc2Local.interceptor'
import { UpdateWorkplaceDto } from './dto/update-workplace.dto'
import { FileInterceptor } from '@nestjs/platform-express'

@Controller('workplace')
export class WorkplaceController {
  constructor(private readonly workplaceService: WorkplaceService) {}

  /**
   * 创建工点
   * @param createWorkplaceDto
   */
  @Post('/create')
  @Auth()
  async create(@Body() createWorkplaceDto: CreateWorkplaceDto, @UserInfo() userInfo: User) {
    return Result.success(await this.workplaceService.create(createWorkplaceDto, userInfo), '工点创建成功')
  }

  /**
   * 查询工点列表
   * @param current
   * @param pageSize
   * @param sortField
   * @param sortOrder
   * @param workPlaceType
   * @param userInfo
   */
  @Get('/getlist')
  @UseInterceptors(UtcToLocalInterceptor)
  @Auth()
  async getlist(
    @Query('current', new DefaultValuePipe(1), generateParseIntPipe('current')) current: number,
    @Query('pageSize', new DefaultValuePipe(10), generateParseIntPipe('pageSize')) pageSize: number,
    @Query('sortField', new DefaultValuePipe('sortNumber')) sortField: string,
    @Query('sortOrder', new DefaultValuePipe('ASC')) sortOrder: Order,
    @Query('workPlaceType') workPlaceType: WorkPlaceType,
    @UserInfo() userInfo: User,
  ) {
    return Result.success(
      await this.workplaceService.getList(current, pageSize, sortField, sortOrder, workPlaceType, userInfo),
      '工点列表获取成功',
    )
  }

  /**
   * 获取工点列表，无分页
   * @param sortField
   * @param sortOrder
   * @param userInfo
   */
  @Get('/getlistnopage')
  @Auth()
  async getlistnopage(
    @Query('sortField', new DefaultValuePipe('sortNumber')) sortField: string,
    @Query('sortOrder', new DefaultValuePipe('ASC')) sortOrder: Order,
    @UserInfo() userInfo: User,
  ) {
    return Result.success(await this.workplaceService.getListNoPage(sortField, sortOrder, userInfo), '工点列表获取成功')
  }

  /**
   * 查询工点
   */
  @Get('/get')
  @Auth()
  async getOne(@Query('id') id: string) {
    return Result.success(await this.workplaceService.getOne(id), '工点获取成功')
  }

  /**
   * 更新工点
   * @param updateWorkplaceDto
   * @param userInfo
   */
  @Post('/update')
  @Auth()
  async update(@Body() updateWorkplaceDto: UpdateWorkplaceDto, @UserInfo() userInfo: User) {
    return Result.success(await this.workplaceService.update(updateWorkplaceDto, userInfo), '工点更新成功')
  }

  /**
   * 删除工点
   * @param id
   */
  @Post('/delete')
  @Auth()
  async delete(@Body('id') id: string) {
    return Result.success(await this.workplaceService.delete(id), '工点删除成功')
  }

  /**
   * 上传
   * @param file
   * @param userInfo
   */
  @Post('/upload')
  @Auth()
  @UseInterceptors(FileInterceptor('file'))
  async upload(@UploadedFile() file: Express.Multer.File, @UserInfo() userInfo: User) {
    return await this.workplaceService.upload(file, userInfo)
  }

  /**
   *  导出
   * @param current
   * @param pageSize
   * @param userInfo
   */
  @Post('/export')
  @Auth()
  async export(@Body('current') current: number, @Body('pageSize') pageSize: number, @UserInfo() userInfo: User) {
    return Result.success(await this.workplaceService.export(current, pageSize, userInfo), '工点导出成功')
  }

  /**
   * 工点关联清单
   * @param id
   * @param listIds
   * @param userInfo
   */
  @Post('/relevanceListId')
  @Auth()
  async relevanceListId(@Body('id') id: string, @Body('listIds') listIds: string[], @UserInfo() userInfo: User) {
    return Result.success(await this.workplaceService.relevanceList(id, listIds, userInfo), '工点关联列表成功')
  }

  /**
   * 查询关联的清单列表
   * @param id
   * @param userInfo
   */
  @Get('/getWorkPlaceRelevanceList')
  @Auth()
  async getWorkPlaceRelevanceList(
    @Query('id') id: string,
    @Query('current', new DefaultValuePipe(1), generateParseIntPipe('current')) current: number,
    @Query('pageSize', new DefaultValuePipe(10), generateParseIntPipe('pageSize')) pageSize: number,
    @Query('sortField', new DefaultValuePipe('serialNumber')) sortField: string,
    @Query('sortOrder', new DefaultValuePipe('ASC')) sortOrder: Order,
    @Query('listCode') listCode: string,
    @Query('listName') listName: string,
    @Query('listCharacteristic') listCharacteristic: string,
    @UserInfo() userInfo: User,
  ) {
    return Result.success(
      await this.workplaceService.getWorkPlaceRelevanceList(
        id,
        current,
        pageSize,
        sortField,
        sortOrder,
        listCode,
        listName,
        listCharacteristic,
        userInfo,
      ),
      '查询关联的清单列表成功',
    )
  }

  /**
   * 更新关联的清单的工程量
   * @param allQuantities
   * @param userInfo
   */
  @Post('/updateWorkPlaceListQuantities')
  @Auth()
  async updateQuantities(
    @Body('id') id: string,
    @Body('allQuantities') allQuantities: number,
    @Body('leftQuantities') leftQuantities: number,
    @Body('rightQuantities') rightQuantities: number,
    @UserInfo() userInfo: User,
  ) {
    return Result.success(
      await this.workplaceService.updateQuantities(id, allQuantities, leftQuantities, rightQuantities, userInfo),
      '更新工程量成功',
    )
  }

  /**
   * 查询清单工点列表(汇总)
   * @param userInfo
   */
  @Get('/getWorkPlace/relevanceList')
  @Auth()
  async getWorkPlaceRelevanceCollectList(
    @Query('current', new DefaultValuePipe(1), generateParseIntPipe('current')) current: number,
    @Query('pageSize', new DefaultValuePipe(10), generateParseIntPipe('pageSize')) pageSize: number,
    @Query('sortField', new DefaultValuePipe('serialNumber')) sortField: string,
    @Query('sortOrder', new DefaultValuePipe('ASC')) sortOrder: Order,
    @UserInfo() userInfo: User,
  ) {
    return Result.success(
      await this.workplaceService.getWorkPlaceRelevanceCollectList(current, pageSize, sortField, sortOrder, userInfo),
      '查询关联的清单列表成功',
    )
  }

  /**
   * 删除工点下关联的清单
   */
  @Post('/deleteWorkPlace/relevanceList')
  @Auth()
  async deleteWorkPlaceRelevanceList(@Body('ids') ids: string[]) {
    return Result.success(await this.workplaceService.deleteWorkPlaceRelevanceList(ids), '删除关联的清单成功')
  }

  /**
   * 根据清单获取工点
   * @param listId
   */
  @Get('/getWorkPlaceByListId')
  @Auth()
  async getWorkPlaceByListId(
    @Query('current', new DefaultValuePipe(1), generateParseIntPipe('current')) current: number,
    @Query('pageSize', new DefaultValuePipe(10), generateParseIntPipe('pageSize')) pageSize: number,
    @Query('listId') listId: string,
    @UserInfo() userInfo: User,
  ) {
    return Result.success(
      await this.workplaceService.getWorkPlaceByListId(current, pageSize, listId, userInfo),
      '查询工点成功',
    )
  }
}
