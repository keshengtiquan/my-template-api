import * as crypto from 'crypto'
import { BadRequestException, ParseIntPipe } from '@nestjs/common'

export function md5(str) {
  const hash = crypto.createHash('md5')
  hash.update(str)
  return hash.digest('hex')
}
export function formatDate(date: Date, format: string) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')

  format = format.replace('YYYY', String(year))
  format = format.replace('MM', month)
  format = format.replace('DD', day)
  format = format.replace('HH', hours)
  format = format.replace('mm', minutes)
  format = format.replace('ss', seconds)

  return format
}

/**
 * @description 构造树型结构数据
 * @param data 数据源
 * @param id id字段 默认id
 * @param parentId 父节点字段，默认parentId
 * @param children 子节点字段，默认children
 * @returns 追加字段后的树
 */
export const handleTree = (data: any[], id?: string, parentId?: string, children?: string): any => {
  if (!Array.isArray(data)) {
    console.warn('data must be an array')
    return []
  }
  const config = {
    id: id || 'id',
    parentId: parentId || 'parentId',
    childrenList: children || 'children',
  }

  const childrenListMap: any = {}
  const nodeIds: any = {}
  const tree = []

  for (const d of data) {
    const parentId = d[config.parentId]
    if (childrenListMap[parentId] == null) {
      childrenListMap[parentId] = []
    }
    nodeIds[d[config.id]] = d
    childrenListMap[parentId].push(d)
  }

  for (const d of data) {
    const parentId = d[config.parentId]
    if (nodeIds[parentId] == null) {
      tree.push(d)
    }
  }

  for (const t of tree) {
    adaptToChildrenList(t)
  }

  function adaptToChildrenList(o: Record<string, any>) {
    if (childrenListMap[o[config.id]] !== null) {
      o[config.childrenList] = childrenListMap[o[config.id]]
    }
    if (o[config.childrenList]) {
      for (const c of o[config.childrenList]) {
        adaptToChildrenList(c)
      }
    }
  }
  return tree
}

/**
 * 转数字管道
 * @param name
 */
export function generateParseIntPipe(name) {
  return new ParseIntPipe({
    exceptionFactory() {
      throw new BadRequestException(name + ' 应该传数字')
    },
  })
}

/**
 * 根据parentid 查找当前节点的所有父级节点
 * @param parentId 当前节点的parentid
 * @param uniqueId 根据那个字段来匹配
 * @param tree 当前的树数据
 * @returns
 */
export const getParentIds = (parentId: string, uniqueId: string, tree: any[]) => {
  const deptMap = tree.reduce((map, item) => {
    if (!map[item[uniqueId]]) {
      map[item[uniqueId]] = item.parentId
    }
    return map
  }, {})

  const parentIds: string[] = []

  function findParents(parentId: string) {
    if (deptMap[parentId]) {
      parentIds.push(deptMap[parentId])
      findParents(deptMap[parentId])
    }
  }
  findParents(parentId)
  parentIds.push(parentId)
  return parentIds
}
// 获取项目运行环境
export const getEnv = () => {
  return process.env.RUNNING_ENV
}
export const IS_DEV = getEnv() === 'dev'

export const addTreeLeaf = (data: any[]) => {
  return data.map((item) => {
    const obj = { ...item, isTreeLeaf: true }
    if (item.children && item.children.length > 0) {
      obj.children = addTreeLeaf(item.children)
    } else {
      obj.isTreeLeaf = false
    }
    return obj
  })
}

/**
 * @description 广度优先遍历，根据唯一uniqueId找当前节点信息
 * @param tree 树
 * @param uniqueId 唯一uniqueId
 * @returns 当前节点信息
 */
export const getNodeByUniqueId = (tree: any[], uniqueId: number | string, field: string): any => {
  if (!Array.isArray(tree)) {
    console.warn('menuTree must be an array')
    return []
  }
  if (!tree || tree.length === 0) return []
  const item = tree.find((node) => node[field] === uniqueId)
  if (item) return item
  const childrenList = tree
    .filter((node) => node.children)
    .map((i) => i.children)
    .flat(1) as unknown
  return getNodeByUniqueId(childrenList as any[], uniqueId, field)
}
