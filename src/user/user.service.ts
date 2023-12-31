import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { PrismaService } from 'src/prisma/prisma.service';
import * as argon from 'argon2';

@Injectable()
export class UserService {
    constructor(private readonly prismaService: PrismaService) { }

    async getAllUsers() {
        const users = await this.prismaService.user.findMany({
            include: {
                Purchases: true,
                Sales: true
            }
        });

        if (users.length === 0) {
            throw new NotFoundException('Users not found');
        }

        users.map(user => {
            delete user.hashed_password;
        });

        return users;
    }

    async getUserById(id: number) {
        const user = await this.prismaService.user.findUnique({
            where: {
                id
            }
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        delete user.hashed_password;

        return user;
    }

    async updateUserById(id: number, data: any) {
        try {

            const user = await this.prismaService.user.update({
                where: {
                    id
                },
                data
            });

            if (!user) {
                throw new NotFoundException('User not found');
            }

            delete user.hashed_password;

            return user;

        } catch (error) {

            if (error instanceof PrismaClientKnownRequestError) {
                if (error.code === 'P2002') {
                    if (error.meta.target[0] === 'email') {
                        throw new NotFoundException('Email already exists');
                    }

                    if (error.meta.target[0] === 'username') {
                        throw new NotFoundException('Username already exists');
                    }
                }
            }

            throw new Error(error);

        }
    }

    async updateMyPassword(id: number, password: any) {
        try {
            
            const hashed_password = await argon.hash(password);

            const user = await this.prismaService.user.update({
                where: {
                    id
                },
                data: {
                    hashed_password
                }
            });

            if (!user) {
                throw new NotFoundException('User not found');
            }

            delete user.hashed_password;

            return user;

        } catch (error) {

            throw new Error(error);

        }
    }

    async deleteUserById(id: number) {
        const user = await this.prismaService.user.delete({
            where: {
                id
            }
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        delete user.hashed_password;

        return user;
    }

}