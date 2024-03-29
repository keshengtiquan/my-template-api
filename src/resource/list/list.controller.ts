import { Body, Controller, DefaultValuePipe, Get, Post, Query, UploadedFile, UseInterceptors } from '@nestjs/common'
import { ListService } from './list.service'
import { FileInterceptor } from '@nestjs/platform-express'
import { Auth } from '../../sys/auth/decorators/auth.decorators'
import { User } from '../../sys/user/entities/user.entity'
import { UserInfo } from '../../decorators/user.dectorator'
import { Result } from '../../common/result'
import { generateParseIntPipe } from '../../utils'
import { Order } from '../../types'
import { UtcToLocalInterceptor } from '../../interceptor/utc2Local.interceptor'
import { CreateListDto } from './dto/create-list.dto'
import { UpdateListDto } from './dto/update-list.dto'
import { FileNameEncodePipe } from '../../common/pipe/file-name-encode-pipe'

@Controller('list')
export class ListController {
  constructor(private readonly listService: ListService) {}

  /**
   * 导入文件
   * @param file
   * @param userInfo
   */
  @Post('/upload')
  @Auth()
  @UseInterceptors(FileInterceptor('file'))
  async upload(@UploadedFile(new FileNameEncodePipe()) file: Express.Multer.File, @UserInfo() userInfo: User) {
    return await this.listService.upload(file, userInfo)
  }

  /**
   * 文件导出
   */
  @Get('/export')
  @Auth()
  async export(@Query('sectionalEntry') sectionalEntry: string, @UserInfo() userInfo: User) {
    return await this.listService.export(sectionalEntry, userInfo)
  }

  /**
   * 查询清单列表
   * @param current
   * @param pageSize
   * @param sortField
   * @param sortOrder
   * @param userInfo
   */
  @Get('/getlist')
  @Auth()
  @UseInterceptors(UtcToLocalInterceptor)
  async getlist(
    @Query('current', new DefaultValuePipe(1), generateParseIntPipe('current')) current: number,
    @Query('pageSize', new DefaultValuePipe(10), generateParseIntPipe('pageSize')) pageSize: number,
    @Query('sortField', new DefaultValuePipe('createTime')) sortField: string,
    @Query('sortOrder', new DefaultValuePipe('ASC')) sortOrder: Order,
    @Query('listCode') listCode: string,
    @Query('listName') listName: string,
    @Query('listCharacteristic') listCharacteristic: string,
    @Query('sectionalEntry') sectionalEntry: string,
    @UserInfo() userInfo: User,
  ) {
    return Result.success(
      await this.listService.getlist(
        current,
        pageSize,
        sortField,
        sortOrder,
        listCode,
        listName,
        listCharacteristic,
        sectionalEntry,
        userInfo,
      ),
    )
  }

  /**
   * 查询排除后的列表（工点）
   * @param current
   * @param pageSize
   * @param workplaceId
   * @param sortField
   * @param sortOrder
   * @param userInfo
   */
  @Get('/getlistExclude')
  @Auth()
  async getlistExclude(
    @Query('current', new DefaultValuePipe(1), generateParseIntPipe('current')) current: number,
    @Query('pageSize', new DefaultValuePipe(10), generateParseIntPipe('pageSize')) pageSize: number,
    @Query('workPlaceId') workPlaceId: string,
    @Query('sortField', new DefaultValuePipe('serialNumber')) sortField: string,
    @Query('sortOrder', new DefaultValuePipe('ASC')) sortOrder: Order,
    @UserInfo() userInfo: User,
  ) {
    return Result.success(
      await this.listService.getlistExclude(current, pageSize, workPlaceId, sortField, sortOrder, userInfo),
    )
  }

  /**
   * 获取清单
   * @param id
   */
  @Get('/get')
  @Auth()
  async getOneById(@Query('id') id: string) {
    return Result.success(await this.listService.getOneById(id))
  }

  /**
   * 创建清单
   * @param createListDto
   * @param userInfo
   */
  @Post('/create')
  @Auth()
  async create(@Body() createListDto: CreateListDto, @UserInfo() userInfo: User) {
    return Result.success(await this.listService.create(createListDto, userInfo), '清单创建成功')
  }

  /**
   * 更新列表
   * @param updateListDto
   * @param userInfo
   */
  @Post('/update')
  @Auth()
  async update(@Body() updateListDto: UpdateListDto, @UserInfo() userInfo: User) {
    return Result.success(await this.listService.update(updateListDto, userInfo), '清单更新成功')
  }

  /**
   * 删除清单
   * @param id
   */
  @Post('/delete')
  @Auth()
  async delete(@Body('id') id: string) {
    return Result.success(await this.listService.delete(id), '清单删除成功')
  }

  /**
   * 查询排除后的列表（分部分项）
   * @param current
   * @param pageSize
   * @param listCode
   * @param listName
   * @param listCharacteristic
   * @param userInfo
   */
  @Get('/getlistDivisionExclude')
  @Auth()
  async getlistDivisionExclude(
    @Query('current', new DefaultValuePipe(1), generateParseIntPipe('current')) current: number,
    @Query('pageSize', new DefaultValuePipe(10), generateParseIntPipe('pageSize')) pageSize: number,
    @Query('listCode') listCode: string,
    @Query('listName') listName: string,
    @Query('listCharacteristic') listCharacteristic: string,
    @UserInfo() userInfo: User,
  ) {
    return Result.success(
      await this.listService.getlistDivisionExclude(
        current,
        pageSize,
        listCode,
        listName,
        listCharacteristic,
        userInfo,
      ),
    )
  }

  /**
   * 查询排除后的列表（甘特图）
   * @param current
   * @param pageSize
   * @param sortField
   * @param sortOrder
   * @param listCode
   * @param listName
   * @param listCharacteristic
   * @param sectionalEntry
   * @param userInfo
   */
  @Get('/getGanttExclude')
  @Auth()
  async getGanttExclude(
    @Query('current', new DefaultValuePipe(1), generateParseIntPipe('current')) current: number,
    @Query('pageSize', new DefaultValuePipe(10), generateParseIntPipe('pageSize')) pageSize: number,
    @Query('sortField', new DefaultValuePipe('serialNumber')) sortField: string,
    @Query('sortOrder', new DefaultValuePipe('ASC')) sortOrder: Order,
    @Query('listCode') listCode: string,
    @Query('listName') listName: string,
    @Query('listCharacteristic') listCharacteristic: string,
    @Query('sectionalEntry') sectionalEntry: string,
    @UserInfo() userInfo: User,
  ) {
    return Result.success(
      await this.listService.getGanttExclude(
        current,
        pageSize,
        sortField,
        sortOrder,
        listCode,
        listName,
        listCharacteristic,
        sectionalEntry,
        userInfo,
      ),
    )
  }

  /**
   * 查询排除后的列表（计划）
   * @param current
   * @param pageSize
   * @param sortField
   * @param sortOrder
   * @param planName
   * @param listCode
   * @param listName
   * @param listCharacteristic
   * @param sectionalEntry
   * @param userInfo
   */
  @Get('/getPlanExclude')
  @Auth()
  async getPlanExclude(
    @Query('current', new DefaultValuePipe(1), generateParseIntPipe('current')) current: number,
    @Query('pageSize', new DefaultValuePipe(10), generateParseIntPipe('pageSize')) pageSize: number,
    @Query('sortField', new DefaultValuePipe('serialNumber')) sortField: string,
    @Query('sortOrder', new DefaultValuePipe('ASC')) sortOrder: Order,
    @Query('planName') planName: string,
    @Query('listCode') listCode: string,
    @Query('listName') listName: string,
    @Query('listCharacteristic') listCharacteristic: string,
    @Query('sectionalEntry') sectionalEntry: string,
    @UserInfo() userInfo: User,
  ) {
    return Result.success(
      await this.listService.getPlanExclude(
        current,
        pageSize,
        sortField,
        sortOrder,
        planName,
        listCode,
        listName,
        listCharacteristic,
        sectionalEntry,
        userInfo,
      ),
    )
  }

  /**
   * 获取日志列表（排除已关联的日志）
   * @param current
   * @param pageSize
   * @param sortField
   * @param sortOrder
   * @param logId
   * @param listCode
   * @param listName
   * @param listCharacteristic
   * @param sectionalEntry
   * @param userInfo
   */
  @Get('/getLogExclude')
  @Auth()
  async getLogExclude(
    @Query('current', new DefaultValuePipe(1), generateParseIntPipe('current')) current: number,
    @Query('pageSize', new DefaultValuePipe(10), generateParseIntPipe('pageSize')) pageSize: number,
    @Query('sortField', new DefaultValuePipe('serialNumber')) sortField: string,
    @Query('sortOrder', new DefaultValuePipe('ASC')) sortOrder: Order,
    @Query('logId') logId: string,
    @Query('listCode') listCode: string,
    @Query('listName') listName: string,
    @Query('listCharacteristic') listCharacteristic: string,
    @Query('sectionalEntry') sectionalEntry: string,
    @UserInfo() userInfo: User,
  ) {
    return Result.success(
      await this.listService.getLogExclude(
        current,
        pageSize,
        sortField,
        sortOrder,
        logId,
        listCode,
        listName,
        listCharacteristic,
        sectionalEntry,
        userInfo,
      ),
    )
  }

  /**
   * 设置清单为重点关注清单
   * @param id
   * @param userInfo
   */
  @Post('/setFocus')
  @Auth()
  async setFocus(@Body('id') id: string, @Body('isFocusList') isFocusList: boolean, @UserInfo() userInfo: User) {
    return Result.success(await this.listService.setFocus(id, isFocusList, userInfo))
  }

  /**
   * 批量删除清单
   * @param ids
   * @param userInfo
   */
  @Post('/batchDelete')
  @Auth()
  async batchDelete(@Body('ids') ids: string[], @UserInfo() userInfo: User) {
    return Result.success(await this.listService.batchDelete(ids, userInfo))
  }

  /**
   * 获取三量对比表
   * @param current 当前页
   * @param pageSize 页面大小
   * @param sortField 排序字段
   * @param sortOrder 排序方式
   * @param listCode 项目编码
   * @param listName 项目名称
   * @param listCharacteristic 项目特征
   * @param sectionalEntry 分部分项
   * @param userInfo 用户信息
   * @returns 清单列表
   */
  @Get('/listCompare')
  @Auth()
  async listCompare(
    @Query('current', new DefaultValuePipe(1), generateParseIntPipe('current')) current: number,
    @Query('pageSize', new DefaultValuePipe(10), generateParseIntPipe('pageSize')) pageSize: number,
    @Query('sortField', new DefaultValuePipe('create_time')) sortField: string,
    @Query('sortOrder', new DefaultValuePipe('ASC')) sortOrder: Order,
    @Query('listCode') listCode: string,
    @Query('listName') listName: string,
    @Query('listCharacteristic') listCharacteristic: string,
    @Query('sectionalEntry') sectionalEntry: string,
    @UserInfo() userInfo: User,
  ) {
    return Result.success(
      await this.listService.listCompare(
        current,
        pageSize,
        sortField,
        sortOrder,
        listCode,
        listName,
        listCharacteristic,
        sectionalEntry,
        userInfo,
      ),
    )
  }

  /**
   * 更新图纸量
   * @param id
   * @param designQuantities
   */
  @Post('/update/listCompare')
  @Auth()
  async updateListCompare(@Body('id') id: string, @Body('designQuantities') designQuantities: number) {
    return Result.success(await this.listService.updateListCompare(id, designQuantities))
  }
}
