import { Inject, Injectable } from '@nestjs/common'
import { ExcelService } from '../../excel/excel.service'

@Injectable()
export class ListService {
  @Inject()
  private readonly excelService: ExcelService

  async upload(file: Express.Multer.File) {
    const excelData = await this.excelService.parseExcel(file, '表-02 建设项目投标报价汇总表(全)', 5)
    console.log(excelData)
  }
}
