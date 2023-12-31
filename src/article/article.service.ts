import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ArticleService {
    constructor(private readonly prismaService: PrismaService) { }

    async getAllAvailableArticles(name?: string) {
        const articles = await this.prismaService.article.findMany({
            where: {
                Purchase: {
                    Game: {
                        name: {
                            contains: name,
                            mode: 'insensitive'
                        }
                    }
                },
                Sale: null
            },
            include: {
                Purchase: {
                    include: {
                        Game: true
                    }
                },
                User: {
                    select: {
                        id: true,
                        username: true,
                        avatar_url: true,
                        Articles: {
                            where: {
                                Sale: null
                            }
                        }
                    }
                }
            },
            orderBy: {
                created_at: 'desc'
            }
        });

        if (!articles.length) {
            throw new NotFoundException('No articles found');
        }

        articles.forEach(article => {
            delete article.Purchase.purchased_price;
            delete article.Purchase.origin;
        });

        return articles;
    }

    async getMyArticles(user_id: number, name?: string) {
        const articles = await this.prismaService.article.findMany({
            where: {
                user_id: user_id,
                Purchase: {
                    Game: {
                        name: {
                            contains: name,
                            mode: 'insensitive'
                        }
                    }
                },
                Sale: null
            },
            include: {
                Purchase: {
                    include: {
                        Game: true
                    }
                },
            },
            orderBy: {
                created_at: 'desc'
            }
        });

        if (!articles.length) {
            throw new NotFoundException('No user articles found');
        }

        return articles;
    }

    async getMySoldedArticles(user_id: number, name?: string) {
        const articles = await this.prismaService.article.findMany({
            where: {
                user_id: user_id,
                Purchase: {
                    Game: {
                        name: {
                            contains: name,
                            mode: 'insensitive'
                        }
                    }
                },
                Sale: {
                    isNot: null
                }
            },
            include: {
                Purchase: {
                    include: {
                        Game: true
                    }
                },
                Sale: true
            },
            orderBy: {
                created_at: 'desc'
            }
        });

        if (!articles.length) {
            throw new NotFoundException('No user articles found');
        }

        return articles;
    }

    async getMyArticleById(user_id: number, id: number) {
        const article = await this.prismaService.article.findUnique({
            where: { id },
            include: {
                Purchase: {
                    include: {
                        Game: true
                    }
                },
                Sale: true
            }
        });

        if (!article) {
            throw new NotFoundException('No article found');
        }

        if (article.user_id !== user_id) {
            throw new ForbiddenException('You are not allowed to see this article');
        }

        return article;
    }

    async getArticleById(id: number) {
        const article = await this.prismaService.article.findUnique({
            where: { id },
            include: {
                Purchase: {
                    include: {
                        Game: true
                    }
                },
                Sale: true,
                User: {
                    select: {
                        id: true,
                        username: true,
                        avatar_url: true,
                        Articles: {
                            where: {
                                Sale: null
                            }
                        }
                    }
                }
            }
        });

        if (!article) {
            throw new NotFoundException('No article found');
        }

        return article;
    }

    async createArticle(user_id: number, article: any) {

        try {
            const newArticle = await this.prismaService.article.create({
                data: {
                    user_id,
                    ...article
                }
            });

            return newArticle;

        } catch (error) {

            if (!(error instanceof PrismaClientKnownRequestError)) {
                throw new Error('Article not created');
            }

            if (error.code === 'P2002') {
                throw new ConflictException('Article already exists');
            }

            if (error.code === 'P2003') {
                throw new NotFoundException('Game not found');
            }

            throw error;
        }
    }

    async updateArticle(user_id: number, article_id: number, data: any) {
        try {
            const updatedArticle = await this.prismaService.article.update({
                where: {
                    id: article_id,
                    user_id
                },
                data
            });

            return updatedArticle;
        } catch (error) {
            if (!(error instanceof PrismaClientKnownRequestError)) {
                throw new Error('Article not updated');
            }

            if (error.code === 'P2025') {
                throw new NotFoundException('Article not found');
            }

            throw error;
        }
    }

    async deleteArticle(user_id: number, id: number) {

        try {
            const deletedArticle = await this.prismaService.article.delete({
                where: {
                    id,
                    user_id
                }
            });

            return deletedArticle;
        } catch (error) {
            if (!(error instanceof PrismaClientKnownRequestError)) {
                throw new Error('Article not deleted');
            }

            if (error.code === 'P2025') {
                throw new NotFoundException('Article not found');
            }

            throw error;
        }

    }
}