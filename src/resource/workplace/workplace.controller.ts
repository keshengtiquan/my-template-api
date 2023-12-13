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
}
