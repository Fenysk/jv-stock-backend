import * as argon from 'argon2';
import { ConflictException, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
    constructor(
        private readonly prismaService: PrismaService,
        private jwt: JwtService,
        private config: ConfigService
    ) { }

    async register(registerDto: any) {
        try {
            const { email, username, password } = registerDto;

            const hashedPassword = await argon.hash(password);

            // Transaction to avoid creating a user without an active cart
            const newUser = await this.prismaService.$transaction(async (prisma) => {
                // Create user and cart
                const createdUser = await prisma.user.create({
                    data: {
                        email,
                        username,
                        hashed_password: hashedPassword,
                        Carts: {
                            create: {}
                        }
                    },
                    include: {
                        Carts: true
                    }
                });

                // Activate user's cart
                const updatedUser = await prisma.user.update({
                    where: {
                        id: createdUser.id
                    },
                    data: {
                        active_cart_id: createdUser.Carts[0].id
                    }
                });

                return updatedUser;
            });

            const token = this.signToken(newUser.id, newUser.email);

            return token;
        } catch (error) {
            if (!(error instanceof PrismaClientKnownRequestError)) {
                throw error;
            }

            if (error.code === 'P2002') {
                if (error.meta.target[0] === 'email') {
                    throw new ConflictException('Email already exists');
                }

                if (error.meta.target[0] === 'username') {
                    throw new ConflictException('Username already exists');
                }
            }

            throw error;
        }
    }

    async login(loginDto: any) {
        const { email, password } = loginDto;

        const user = await this.prismaService.user.findUnique({
            where: {
                email
            }
        });

        if (!user) {
            throw new ForbiddenException('Credentials incorrect');
        }

        const passwordValid = await argon.verify(
            user.hashed_password,
            password
        );

        if (passwordValid === false) {
            throw new UnauthorizedException('Invalid password');
        }

        const token = this.signToken(user.id, user.email);

        return token;
    }

    async signToken(
        user_id: number,
        email: string
    ): Promise<{ access_token: string }> {
        const payload = {
            sub: user_id,
            email
        }

        const secret = this.config.get('JWT_SECRET');

        const token = await this.jwt.signAsync(payload, {
            expiresIn: '7d',
            secret
        })

        return {
            access_token: token
        }
    }
}
