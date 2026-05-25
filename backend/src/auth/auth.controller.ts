import { Body, Controller, Get, Post, Res, UseGuards } from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import type { Response } from 'express';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AUTH_COOKIE_NAME } from './auth.constants';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 60 } })
  async signup(
    @Body() dto: SignupDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const { user, accessToken } = await this.authService.signup(dto);
    response.cookie(
      AUTH_COOKIE_NAME,
      accessToken,
      this.authService.getAuthCookieOptions(),
    );
    return { user, accessToken };
  }

  @Post('login')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 60 } })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const { user, accessToken } = await this.authService.login(dto);
    response.cookie(
      AUTH_COOKIE_NAME,
      accessToken,
      this.authService.getAuthCookieOptions(),
    );
    return { user, accessToken };
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) response: Response) {
    response.clearCookie(
      AUTH_COOKIE_NAME,
      this.authService.getAuthCookieOptions(),
    );
    return { success: true };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@CurrentUser() user: { userId: number }) {
    return this.authService.validateUser(user.userId);
  }
}
