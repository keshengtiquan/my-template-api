import { Controller, Get, Post, Body, Query, DefaultValuePipe, UseInterceptors } from '@nestjs/common';
import { SectionDivisionService } from './section-division.service';
import { Auth } from '../../sys/auth/decorators/auth.decorators';
import { generateParseIntPipe } from '../../utils';
import { Order } from '../../types';
import { UserInfo } from '../../decorators/user.dectorator';
import { User } from '../../sys/user/entities/user.entity';
import { Result } from '../../common/result';
import { UtcToLocalInterceptor } from '../../interceptor/utc2Local.interceptor';
import { UpdateSectionDivisionDto } from './dto/update-section-division.dto';

@Controller('sectionDivision')
export class SectionDivisionController {
  constructor(private readonly sectionDivisionService: SectionDivisionService) {}

  /**
   * 查询区段划分列表
   * @param current
   * @param pageSize
   * @param sortField
   * @param sortOrder
   * @param userInfo
   */
  @Get('/getList')
  @Auth()
  @UseInterceptors(UtcToLocalInterceptor)
  async findAll(
    @Query('current', new DefaultValuePipe(1), generateParseIntPipe('current')) current: number,
    @Query('pageSize', new DefaultValuePipe(10), generateParseIntPipe('pageSize')) pageSize: number,
    @Query('sortField', new DefaultValuePipe('id')) sortField: string,
    @Query('sortOrder', new DefaultValuePipe('ASC')) sortOrder: Order,
    @UserInfo() userInfo: User,
  ) {
    return Result.success(await this.sectionDivisionService.findAll(current, pageSize, sortField, sortOrder, userInfo));
  }

  /**
   * 更新区段的工点和清单等
   * @param updateSectionDivisionDto
   * @param userInfo
   */
  @Post('/update')
  @Auth()
  async update(@Body() updateSectionDivisionDto: UpdateSectionDivisionDto, @UserInfo() userInfo: User) {
    return Result.success(await this.sectionDivisionService.update(updateSectionDivisionDto, userInfo));
  }

  /**
   * 获取区段的工程量清单列表
   */
  @Get('/getSectionDivisionList')
  @Auth()
  async getSectionDivisionList(
    @Query('current', new DefaultValuePipe(1), generateParseIntPipe('current')) current: number,
    @Query('pageSize', new DefaultValuePipe(10), generateParseIntPipe('pageSize')) pageSize: number,
    @Query('id') id: string,
    @UserInfo() userInfo: User,
  ) {
    return Result.success(await this.sectionDivisionService.getSectionDivisionList(current, pageSize, id, userInfo));
  }

  /**
   * 删除区段中已选择的清单
   * @param listId 清单的ID
   * @param id 区段ID
   * @param userInfo
   */
  @Post('/deleteSectionDivisionList')
  @Auth()
  async deleteSectionDivisionList(@Body('listId') listId: string, @Body('id') id: string, @UserInfo() userInfo: User) {
    return Result.success(await this.sectionDivisionService.deleteSectionDivisionList(listId, id, userInfo));
  }

  /**
   * 获取区段中的工点名称
   * @param id
   * @param userInfo
   */
  @Get('/getSectionDivisionWorkPlaceName')
  @Auth()
  async getSectionDivisionWorkPlaceName(@Query('id') id: string, @UserInfo() userInfo: User) {
    return Result.success(await this.sectionDivisionService.getSectionDivisionWorkPlaceName(id, userInfo));
  }

  /**
   * 更新责任区段和责任人
   * @param id
   * @param sector
   * @param principal
   * @param userInfo
   */
  @Post('/updateSectorAndPrincipal')
  @Auth()
  async updateSectorAndPrincipal(
    @Body('id') id: string,
    @Body('sector') sector: string,
    @Body('principal') principal: string,
    @UserInfo() userInfo: User,
  ) {
    return Result.success(await this.sectionDivisionService.updateSectorAndPrincipal(id, sector, principal, userInfo));
  }

  /**
   * 获取区段中的清单id和工点id
   * @param id
   * @param userInfo
   */
  @Get('/getListIdsAndWorkplaceIds')
  @Auth()
  async getListsAndWorkplace(@Query('id') id: string, @UserInfo() userInfo: User) {
    return Result.success(await this.sectionDivisionService.getListsAndWorkplace(id, userInfo));
  }
}
