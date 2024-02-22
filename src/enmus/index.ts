export enum ManagementGroup {
  ID = '000000',
}

export enum Status {
  ENABLE = '0',
  FORBIDDEN = '1',
}

export enum UserType {
  SYSUSER = 'sys_user',
}

export enum ImportFileService {
  PROJECTIMPORT = 'projectListImport',
  WORKPLACEIMPORT = 'WorkPlaceImport',
  WORKPLACELISTRELEVANCESERVICE = 'WorkPlaceListRelevanceService',
  DIVISIONIMPORT = 'DivisionImport',
}

export enum ExportFileService {
  LISTEXPORT = 'ListExportService',
  WORKPLACEEXPORT = 'WorkPlaceExportService',
}

export enum DeptTypeEnum {
  COMPANY = '0',
  DEPARTMENT = '1',
  TEAM = '2',
}

export enum WorkPlaceTypeEnum {
  STATION = 'station',
  SECTION = 'section',
}

export enum DivisionTypeEnum {
  UNITPROJECT = '单位工程',
  SUBUNITPROJECT = '子单位工程',
  SEGMENTPROJECT = '分部工程',
  SUBSEGMENTPROJECT = '子分部工程',
  SUBITEMPROJECT = '分项工程',
}
