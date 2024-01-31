import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  HttpException,
  HttpStatus,
  MaxFileSizeValidator,
  ParseFilePipe,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common'
import { ExcelService } from './excel.service'
import { FileInterceptor } from '@nestjs/platform-express'
import { Express } from 'express'
import { Result } from '../common/result'
import { FileNameEncodePipe } from '../common/pipe/file-name-encode-pipe'
import { CreateExcelDto } from './dto/create-excel.dto'
import { User } from '../sys/user/entities/user.entity'
import { UserInfo } from '../decorators/user.dectorator'
import { Auth } from '../sys/auth/decorators/auth.decorators'
import { generateParseIntPipe } from '../utils'
import { UpdateExcelDto } from './dto/update-excel.dto'
import { CreateExportExcelDto } from './dto/create-export-excel.dto'
import { UpdateExportExcelDto } from './dto/update-export-excel.dto'

@Controller('excel')
export class ExcelController {
  constructor(private readonly excelService: ExcelService) {}

  /**
   * 上传Excel模版
   * @param file
   */
  @Post('/upload/template')
  @UseInterceptors(FileInterceptor('file'))
  @Auth()
  async uploadTemplate(
    @UploadedFile(
      new ParseFilePipe({
        exceptionFactory: (err) => {
          throw new HttpException('xxx' + err, HttpStatus.BAD_REQUEST)
        },
        validators: [new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 10 })],
      }),
      new FileNameEncodePipe(),
    )
    file: Express.Multer.File,
  ) {
    return await this.excelService.parseTemplate(file)
  }

  /**
   * 创建模版
   * @param createExcelDto
   */
  @Post('/create')
  @Auth()
  async create(@Body() createExcelDto: CreateExcelDto, @UserInfo() userInfo: User) {
    return Result.success(await this.excelService.create(createExcelDto, userInfo), '创建模版成功')
  }

  /**
   * 查询列表
   * @param current
   * @param pageSize
   * @param userInfo
   */
  @Get('/getlist')
  @Auth()
  async getList(
    @Query('current', new DefaultValuePipe(1), generateParseIntPipe('current')) current: number,
    @Query('pageSize', new DefaultValuePipe(10), generateParseIntPipe('pageSize')) pageSize: number,
    @UserInfo() userInfo: User,
  ) {
    return Result.success(await this.excelService.getAll(current, pageSize, userInfo))
  }

  /**
   * 查询单条
   * @param id
   */
  @Get('/get')
  @Auth()
  async getOneById(@Query('id') id: string) {
    return Result.success(await this.excelService.getOneById(id))
  }

  /**
   * 删除单条
   * @param id
   */
  @Post('/delete')
  @Auth()
  async delete(@Query('id') id: string) {
    return Result.success(await this.excelService.delete(id))
  }

  /**
   * 更新模版
   * @param updateExcelDto
   * @param userInfo
   */
  @Post('/update')
  @Auth()
  async update(@Body() updateExcelDto: UpdateExcelDto, @UserInfo() userInfo: User) {
    return Result.success(await this.excelService.update(updateExcelDto, userInfo), '更新模版成功')
  }

  /**
   *  导出模版创建
   * @param createExportExcelDto
   * @param userInfo
   */
  @Post('/export/create')
  @Auth()
  async exportCreate(@Body() createExportExcelDto: CreateExportExcelDto, @UserInfo() userInfo: User) {
    return Result.success(await this.excelService.exportCreate(createExportExcelDto, userInfo), '创建导出模版成功')
  }

  /**
   * 导出模版列表
   * @param current
   * @param pageSize
   * @param userInfo
   */
  @Get('/export/getlist')
  @Auth()
  async getExportList(
    @Query('current', new DefaultValuePipe(1), generateParseIntPipe('current')) current: number,
    @Query('pageSize', new DefaultValuePipe(10), generateParseIntPipe('pageSize')) pageSize: number,
    @UserInfo() userInfo: User,
  ) {
    return Result.success(await this.excelService.getExportList(current, pageSize, userInfo))
  }

  /**
   * 导出模版详情
   * @param id
   */
  @Get('/export/get')
  @Auth()
  async getExportOneById(@Query('id') id: string) {
    return Result.success(await this.excelService.getExportOneById(id))
  }

  /**
   * 导出模版更新
   * @param updateExportExcelDto
   * @param userInfo
   */
  @Post('/export/update')
  @Auth()
  async updateExport(@Body() updateExportExcelDto: UpdateExportExcelDto, @UserInfo() userInfo: User) {
    return Result.success(await this.excelService.updateExport(updateExportExcelDto, userInfo), '更新导出模版成功')
  }
  /**
   * 导入模板下载
   * @param userInfo
   */
  @Post('/template')
  @Auth()
  async exportTemplate(
    @Body('serviceName') serviceName: string,
    @Body('removeField') removeField: string[],
    @UserInfo() userInfo: User,
  ) {
    return await this.excelService.exportTemplate(serviceName, removeField, userInfo)
  }
}
