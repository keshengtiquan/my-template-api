import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { DocumentInfoDto, OnlyofficeEditorConfig } from './dto/documnet.dto';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { OnlyofficeCallbackDto } from './dto/callback.dto';
import { HttpService } from '@nestjs/axios';
import { AxiosResponse } from 'axios';
import { createWriteStream, WriteStream } from 'fs';
import { join } from 'path';

@Injectable()
export class OnlyofficeService {
  @Inject()
  private config: ConfigService;
  @Inject(JwtService)
  private jwtService: JwtService;
  constructor(private readonly request: HttpService) {}

  async documentInfo(query: DocumentInfoDto) {
    const editorConfig = this.editorDefaultConfig();

    // 添加文档
    editorConfig.document = {
      ...editorConfig.document,
      fileType: query.fileType,
      key: query.key,
      url: `${this.config.get('DOMAIN')}/static${query.url}`,
      title: query.title,
    };
    // 修改文档宽度
    editorConfig.width = '100%';
    editorConfig.height = '100%';
    // 修改编辑器类型
    editorConfig.documentType = query.documentType;
    // 添加用户信息
    editorConfig.editorConfig.user = query.user;

    return this.signJwt(editorConfig);
  }

  /**
   *  默认配置
   */
  editorDefaultConfig(): OnlyofficeEditorConfig {
    const { ...defaultConfig } = new OnlyofficeEditorConfig();
    return defaultConfig;
  }

  /**
   * JWT加密
   * @param editorConfig
   */
  signJwt(editorConfig: OnlyofficeEditorConfig): OnlyofficeEditorConfig {
    editorConfig.token = this.jwtService.sign(editorConfig, {
      secret: this.config.get('onlyoffice_secret'),
    });
    return editorConfig;
  }

  async callback(body: OnlyofficeCallbackDto) {
    const { url, status } = body;
    if (status === 6) {
      const staticPath = join(process.cwd(), '/static/temp');
      try {
        // 根据地址下载文档文件
        const file: AxiosResponse = await this.request.axiosRef.get(url, {
          responseType: 'stream',
        });
        const stream: WriteStream = createWriteStream(join(staticPath, body.key));
        file.data.pipe(stream);
      } catch (error) {
        // 返回 Onlyoffice 服务认识的报错
        throw new HttpException({ error: 7 }, HttpStatus.OK);
      }
    } else if (status === 7) {
      // 强制保存文档出错
      throw new HttpException({ error: status }, HttpStatus.OK);
    }
    // 默认返回成功的状态
    return { error: 0 };
  }
}
