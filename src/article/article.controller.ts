import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ArticleService } from './article.service';
import { CreateArticleDto } from './dto';
import { JwtGuard, RolesGuard } from 'src/auth/guard';
import { GetUser, Roles } from 'src/auth/decorator';
import { Role } from 'src/auth/enums/role.enum';

@Controller('article')
export class ArticleController {
    constructor(private readonly articleService: ArticleService) { }

    @Get('get/available')
    getAllArticles(@Query('name') name?: string) {
        return this.articleService.getAllAvailableArticles(name);
    }

    @UseGuards(JwtGuard, RolesGuard)
    @Roles(Role.SALLER)
    @Get('get/mine')
    getMyArticles(
        @GetUser('id') user_id: number,
        @Query('name') name?: string
    ) {
        return this.articleService.getMyArticles(user_id, name);
    }

    @UseGuards(JwtGuard, RolesGuard)
    @Roles(Role.SALLER)
    @Get('get/mine/solded')
    getMySoldedArticles(
        @GetUser('id') user_id: number,
        @Query('name') name?: string
    ) {
        return this.articleService.getMySoldedArticles(user_id, name);
    }
    
    @UseGuards(JwtGuard, RolesGuard)
    @Roles(Role.SALLER)
    @Get('get/mine/:id')
    getMyArticleById(
        @GetUser('id') user_id: number,
        @Param('id') id: string
    ) {
        return this.articleService.getMyArticleById(user_id, Number(id));
    }

    @Get('get/:id')
    getArticleById(
        @Param('id') id: string
    ) {
        return this.articleService.getArticleById(Number(id));
    }

    @UseGuards(JwtGuard, RolesGuard)
    @Roles(Role.SALLER)
    @Post('create')
    createArticle(
        @GetUser('id') user_id: number,
        @Body() article: CreateArticleDto
    ) {
        return this.articleService.createArticle(user_id, article);
    }

    @UseGuards(JwtGuard, RolesGuard)
    @Roles(Role.SALLER)
    @Put('update/:id')
    updateArticle(
        @GetUser('id') user_id: number,
        @Param('id') article_id: string,
        @Body() data: any
    ) {
        return this.articleService.updateArticle(user_id, Number(article_id), data);
    }

    @UseGuards(JwtGuard, RolesGuard)
    @Roles(Role.SALLER)
    @Delete('delete/:id')
    deleteArticle(
        @GetUser('id') user_id: number,
        @Param('id') id: string
    ) {
        return this.articleService.deleteArticle(user_id, Number(id));
    }

}
