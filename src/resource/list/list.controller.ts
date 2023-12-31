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
  async upload(@UploadedFile() file: Express.Multer.File, @UserInfo() userInfo: User) {
    return await this.listService.upload(file, userInfo)
  }

  /**
   * 文件导出
   */
  @Get('/export')
  @Auth()
  async export(@Query('current') current: number, @Query('pageSize') pageSize: number) {
    return Result.success(await this.listService.export(current, pageSize))
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
    @Query('sortField', new DefaultValuePipe('serialNumber')) sortField: string,
    @Query('sortOrder', new DefaultValuePipe('ASC')) sortOrder: Order,
    @Query('listCode') listCode: string,
    @Query('listName') listName: string,
    @Query('listCharacteristic') listCharacteristic: string,
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
        userInfo,
      ),
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
}
