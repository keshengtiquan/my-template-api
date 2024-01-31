import { IsArray, IsDefined, IsIn, IsNumber, IsObject, IsOptional, IsString } from 'class-validator'

export class IActions {
  /**
   * 操作类型
   */
  @IsNumber()
  type: number

  /**
   * 用户 id
   */
  @IsNumber()
  userid?: string | number
}
export class IUser {
  /**
   * 用户 id
   */
  @IsNumber()
  id?: string | number

  /**
   * 用户名，里面包含了组织信息和用户名
   * @example 技术部 程序员未央
   */
  @IsString()
  name?: string
}
class IChange {
  /**
   * 创建时间
   */
  @IsString()
  created?: string

  /**
   * 用户信息
   */
  @IsObject()
  user?: IUser
}
export class IHistory {
  /**
   * 当前 Onlyoffice 服务版本号
   */
  @IsString()
  serverVersion?: string

  /**
   * 历史记录信息
   */
  @IsArray()
  changes?: IChange[]
}
export class OnlyofficeCallbackDto {
  /**
   * 用户与文档的交互状态。0：用户断开与文档共同编辑的连接；1：新用户连接到文档共同编辑；2：用户单击强制保存按钮
   */
  @IsArray()
  @IsOptional()
  actions?: IActions[]

  /**
   * 字段已在 4.2 后版本废弃，请使用 history 代替
   */
  @IsObject()
  @IsOptional()
  changeshistory?: IHistory

  /**
   * 文档变更的历史记录，仅当 status 等于 2 或者 3 时该字段才有值。其中的 serverVersion 字段也是 refreshHistory 方法的入参
   */
  @IsObject()
  @IsOptional()
  history?: IHistory

  /**
   * 文档编辑的元数据信息，用来跟踪显示文档更改记录，仅当 status 等于 2 或者 2 时该字段才有值。该字段也是 setHistoryData（显示与特定文档版本对应的更改，类似 Git 历史记录）方法的入参
   */
  @IsString()
  @IsOptional()
  changesurl?: string

  /**
   * url 字段下载的文档扩展名，文件类型默认为 OOXML 格式，如果启用了 assemblyFormatAsOrigin（https://api.onlyoffice.com/editors/save#assemblyFormatAsOrigin） 服务器设置则文件以原始格式保存
   */
  @IsString()
  @IsOptional()
  filetype?: string

  /**
   * 文档强制保存类型。0：对命令服务（https://api.onlyoffice.com/editors/command/forcesave）执行强制保存；1：每次保存完成时都会执行强制保存请求，仅设置 forcesave 等于 true 时生效；2：强制保存请求由计时器使用服务器中的设置执行。该字段仅 status 等于 7 或者 7 时才有值
   */
  @IsNumber()
  @IsOptional()
  forcesavetype?: number

  /**
   * 文档标识符，类似 id，在 Onlyoffice 服务内部唯一
   */
  @IsDefined()
  @IsString()
  key: string

  /**
   * 文档状态。1：文档编辑中；2：文档已准备好保存；3：文档保存出错；4：文档没有变化无需保存；6：正在编辑文档，但保存了当前文档状态；7：强制保存文档出错
   */
  @IsNumber()
  @IsIn([1, 2, 3, 4, 6, 7])
  @IsOptional()
  status?: number

  /**
   * 已编辑文档的链接，可以通过它下载到最新的文档，仅当 status 等于 2、3、6 或 7 时该字段才有值
   */
  @IsString()
  @IsOptional()
  url?: string

  /**
   * 自定义参数，对应指令服务的 userdata 字段
   */
  @IsObject()
  @IsOptional()
  userdata?: object

  /**
   * 打开文档进行编辑的用户标识列表，当文档被修改时，该字段将返回最后编辑文档的用户标识符，当 status 字段等于 2 或者 6 时有值
   */
  @IsArray()
  @IsOptional()
  users?: string[]

  /**
   * 最近保存时间
   */
  @IsString()
  @IsOptional()
  lastsave?: string

  /**
   * 加密令牌
   */
  @IsString()
  @IsOptional()
  token?: string
}
