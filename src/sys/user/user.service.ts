import { HttpException, HttpStatus, Injectable } from '@nestjs/common'
import { CreateUserDto } from './dto/create-user.dto'
import { User } from './entities/user.entity'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { md5 } from '../../utils'

@Injectable()
export class UserService {
  @InjectRepository(User)
  private userRepository: Repository<User>

  async create(createUserDto: CreateUserDto) {
    const foundUser = await this.userRepository.findOneBy({
      userName: createUserDto.userName,
    })
    if (foundUser) {
      throw new HttpException('用户已存在', HttpStatus.BAD_REQUEST)
    }
    const newUser = new User()
    newUser.userName = createUserDto.userName
    newUser.password = md5(createUserDto.password)
    newUser.nickName = createUserDto.nickName
    try {
      await this.userRepository.save(newUser)
      return '注册成功'
    } catch (e) {
      return '注册失败'
    }
  }
}
