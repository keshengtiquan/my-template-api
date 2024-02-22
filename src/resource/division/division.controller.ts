import { Controller, Get, Post, Body, UseInterceptors, Query, DefaultValuePipe, UploadedFile } from '@nestjs/common'
import { DivisionService } from './division.service'
import { CreateDivisionDto } from './dto/create-division.dto'
import { UpdateDivisionDto } from './dto/update-division.dto'
import { Auth } from '../../sys/auth/decorators/auth.decorators'
import { Result } from '../../common/result'
import { UserInfo } from '../../decorators/user.dectorator'
import { User } from '../../sys/user/entities/user.entity'
import { UtcToLocalInterceptor } from '../../interceptor/utc2Local.interceptor'
import { AddListDto } from './dto/add-list.dto'
import { generateParseIntPipe } from '../../utils'
import { FileNameEncodePipe } from '../../common/pipe/file-name-encode-pipe'
import { FileInterceptor } from '@nestjs/platform-express'

@Controller('division')
export class DivisionController {
  constructor(private readonly divisionService: DivisionService) {}

  /**
   * 创建分部分项
   * @param createDivisionDto
   */
  @Post('/create')
  @Auth()
  async create(@Body() createDivisionDto: CreateDivisionDto, @UserInfo() userInfo: User) {
    return Result.success(await this.divisionService.create(createDivisionDto, userInfo), '创建成功')
  }

  /**
   * 获取分部分项树
   * @param userInfo
   */
  @Get('/getTree')
  @UseInterceptors(UtcToLocalInterceptor)
  @Auth()
  async getTree(@UserInfo() userInfo: User) {
    return Result.success(await this.divisionService.getTree(userInfo), '获取成功')
  }

  /**
   * 根据ID获取分部分项
   * @param id
   * @param userInfo
   */
  @Get('/get')
  @Auth()
  async get(@Query('id') id: string, @UserInfo() userInfo: User) {
    return Result.success(await this.divisionService.getOne(id, userInfo), '获取成功')
  }

  /**
   * 更新分部分项
   * @param id
   * @param updateDivisionDto
   */
  @Post('/update')
  @Auth()
  async update(@Body() updateDivisionDto: UpdateDivisionDto, @UserInfo() userInfo: User) {
    return Result.success(await this.divisionService.updateById(updateDivisionDto, userInfo), '更新成功')
  }

  /**
   * 删除分部分项
   * @param id
   * @param userInfo
   */
  @Post('/delete')
  @Auth()
  async delete(@Body('id') id: string, @Body('isTreeLeaf') isTreeLeaf: boolean, @UserInfo() userInfo: User) {
    return Result.success(await this.divisionService.deleteById(id, isTreeLeaf), '删除成功')
  }

  /**
   * 分部分项分配清单
   * @param addListDto
   */
  @Post('/addList')
  @Auth()
  async addList(@Body() addListDto: AddListDto, @UserInfo() userInfo: User) {
    return Result.success(await this.divisionService.addList(addListDto, userInfo), '添加成功')
  }

  /**
   * 查询分部分项关联的清单列表
   * @param divisionId 分部分项id
   * @param userInfo
   */
  @Get('/getDivisionList')
  @Auth()
  async getDivisionList(
    @Query('divisionId') divisionId: string,
    @Query('current', new DefaultValuePipe(1), generateParseIntPipe('current')) current: number,
    @Query('pageSize', new DefaultValuePipe(10), generateParseIntPipe('pageSize')) pageSize: number,
    @UserInfo() userInfo: User,
  ) {
    return Result.success(
      await this.divisionService.getDivisionList(divisionId, current, pageSize, userInfo),
      '获取成功',
    )
  }

  /**
   * 批量删除分部分项关联的清单
   * @param ids
   * @param userInfo
   */
  @Post('/deleteDivisionList')
  @Auth()
  async deleteDivisionList(@Body('ids') ids: string[]) {
    return Result.success(await this.divisionService.deleteDivisionList(ids), '删除成功')
  }

  /**
   * 根据类型获取分部分项
   * @param divisionType
   * @param userInfo
   */
  @Get('/getSectional')
  @Auth()
  async getSectional(@Query('divisionType') divisionType: string, @UserInfo() userInfo: User) {
    return Result.success(await this.divisionService.getSectional(divisionType, userInfo), '获取成功')
  }

  /**
   * 上传分部分项划分
   * @param file
   * @param userInfo
   */
  @Post('/upload')
  @Auth()
  @UseInterceptors(FileInterceptor('file'))
  async upload(@UploadedFile(new FileNameEncodePipe()) file: Express.Multer.File, @UserInfo() userInfo: User) {
    return await this.divisionService.upload(file, userInfo)
  }

  /**
   * 导出分部分项
   * @param userInfo
   */
  @Post('/exportDivision')
  @Auth()
  async exportDivision(@UserInfo() userInfo: User) {
    return await this.divisionService.exportDivision(userInfo)
  }
}
