import { Injectable } from '@nestjs/common';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { Permission } from './entities/permission.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from 'src/sys/role/entities/role.entity';

@Injectable()
export class PermissionService {
  @InjectRepository(Permission)
  private readonly permissionRepository: Repository<Permission>;
  @InjectRepository(Role)
  private readonly roleRepository: Repository<Role>;

  async init() {
    const data: CreatePermissionDto[] = [
      { key: 'sys:division:add', name: '新增', desc: '分部分项划分', sort: 1 },
      { key: 'sys:division:edit', name: '修改', desc: '分部分项划分', sort: 2 },
      { key: 'sys:division:delete', name: '删除', desc: '分部分项划分', sort: 3 },
      { key: 'sys:division:addSub', name: '添加下级', desc: '分部分项划分', sort: 4 },
      { key: 'sys:division:upload', name: '导入数据', desc: '分部分项划分', sort: 5 },
      //
      { key: 'sys:divisionList:add', name: '新增', desc: '分部分项清单', sort: 1 },
      { key: 'sys:divisionList:delete', name: '删除', desc: '分部分项清单', sort: 2 },
      { key: 'sys:divisionList:batchDelete', name: '批量删除', desc: '分部分项清单', sort: 3 },
      //
      { key: 'sys:list:add', name: '新增', desc: '项目清单', sort: 1 },
      { key: 'sys:list:edit', name: '修改', desc: '项目清单', sort: 2 },
      { key: 'sys:list:delete', name: '删除', desc: '项目清单', sort: 3 },
      { key: 'sys:list:batchDelete', name: '批量删除', desc: '项目清单', sort: 4 },
      { key: 'sys:list:upload', name: '导入数据', desc: '项目清单', sort: 5 },
      { key: 'sys:list:export', name: '导出数据', desc: '项目清单', sort: 6 },
      { key: 'sys:list:focus', name: '重点关注', desc: '项目清单', sort: 7 },
      //
      { key: 'sys:compare:edit', name: '修改', desc: '三量对比', sort: 1 },
      //
      { key: 'sys:workplace:add', name: '新增', desc: '工点列表', sort: 1 },
      { key: 'sys:workplace:edit', name: '修改', desc: '工点列表', sort: 2 },
      { key: 'sys:workplace:delete', name: '删除', desc: '工点列表', sort: 3 },
      { key: 'sys:workplace:upload', name: '导入数据', desc: '工点列表', sort: 4 },
      { key: 'sys:workplace:export', name: '导出数据', desc: '工点列表', sort: 5 },
      { key: 'sys:workplace:uploadCollect', name: '导入汇总', desc: '工点列表', sort: 6 },
      { key: 'sys:workplace:exportCollect', name: '导出汇总', desc: '工点列表', sort: 7 },
      //
      { key: 'sys:workplaceList:add', name: '新增', desc: '工点清单列表', sort: 1 },
      { key: 'sys:workplaceList:edit', name: '编辑', desc: '工点清单列表', sort: 2 },
      { key: 'sys:workplaceList:delete', name: '删除', desc: '工点清单列表', sort: 2 },
      { key: 'sys:workplaceList:batchDelete', name: '批量删除', desc: '工点清单列表', sort: 3 },
      { key: 'sys:workplaceList:upload', name: '导入', desc: '工点清单列表', sort: 4 },
      //
      { key: 'sys:sectionDivision:add', name: '新增', desc: '区段划分', sort: 1 },
      { key: 'sys:sectionDivision:edit', name: '修改', desc: '区段划分', sort: 2 },
      { key: 'sys:sectionDivision:delete', name: '删除', desc: '区段划分', sort: 3 },
      //
      { key: 'sys:gantt:add', name: '新增', desc: '甘特图数据', sort: 1 },
      { key: 'sys:gantt:edit', name: '修改', desc: '甘特图数据', sort: 2 },
      { key: 'sys:gantt:delete', name: '删除', desc: '甘特图数据', sort: 3 },
      { key: 'sys:gantt:addSub', name: '添加下级', desc: '甘特图数据', sort: 4 },
    ];
    return await this.permissionRepository.manager.transaction(async (manager) => {
      await manager
        .createQueryBuilder()
        .delete()
        .from(Permission) // 指定要删除的实体类类型
        .where({}) // 可选：添加删除条件
        .execute();
      const permissions = data.map((item: any) => {
        const permission = new Permission();
        permission.desc = item.desc;
        permission.key = item.key;
        permission.name = item.name;
        permission.sort = item.sort;
        // 设置其他属性...
        return permission;
      });
      return await manager.save(permissions);
    });
  }

  async getlist() {
    const data = await this.permissionRepository.find();
    const mergedPermissions = data.reduce((acc, curr) => {
      const existingGroup = acc.find((group) => group.desc === curr.desc);
      if (existingGroup) {
        existingGroup.actions.push({
          id: curr.id,
          name: curr.name,
          key: curr.key,
          sort: curr.sort,
          desc: curr.desc,
          action: false,
        });
      } else {
        acc.push({
          desc: curr.desc,
          all: false,
          actions: [
            {
              id: curr.id,
              name: curr.name,
              key: curr.key,
              sort: curr.sort,
              action: false,
              desc: curr.desc,
            },
          ],
        });
      }
      return acc;
    }, []);
    return mergedPermissions;
  }

  /**
   * 角色分配权限
   * @param roleId 角色ID
   * @param permission 角色权限数组
   */
  async assignAuth(roleId: string, permissions: Permission[]) {
    const role = await this.roleRepository.findOne({
      where: { id: roleId },
      relations: { menus: true, permissions: true },
    });
    role.permissions = permissions;
    return await this.roleRepository.save(role);
  }
}
