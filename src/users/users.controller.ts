import { 
    Controller, 
    Get, 
    Post, 
    Body, 
    Patch, 
    Param, 
    Delete, 
    UseGuards, 
    HttpCode, 
    HttpStatus 
  } from '@nestjs/common';
  import { UsersService } from './users.service';
  import { 
    CreateUserDto, 
    UpdateUserDto, 
    LoginDto, 
    RefreshTokenDto, 
    ChangePasswordDto, 
    VerifyEmailDto 
  } from './dto/user.dto';
  import { JwtAuthGuard } from './guards/jwt-auth.guard';
  import { Public } from './decorators/public.decorator';
  
  @Controller('users')
  export class UsersController {
    constructor(private readonly usersService: UsersService) {}
  
    @Public()
    @Post('signup')
    async create(@Body() createUserDto: CreateUserDto) {
      await this.usersService.create(createUserDto);
      return { message: 'User registered successfully. Please check your email for verification code.' };
    }
  
    @Public()
    @Post('verify-email')
    verifyEmail(@Body() verifyEmailDto: VerifyEmailDto) {
      return this.usersService.verifyEmail(verifyEmailDto);
    }
  
    @Public()
    @HttpCode(HttpStatus.OK)
    @Post('login')
    login(@Body() loginDto: LoginDto) {
      return this.usersService.login(loginDto);
    }
    
    @Public()
    @HttpCode(HttpStatus.OK)
    @Post('verify-sms')
    verifySmsCode(@Body() body: { email: string, code: string }) {
      return this.usersService.verifySmsCode(body.email, body.code);
    }
  
    @Public()
    @HttpCode(HttpStatus.OK)
    @Post('refresh-token')
    refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
      if (!refreshTokenDto || !refreshTokenDto.refreshToken) {
        throw new Error('Refresh token is required');
      }
      return this.usersService.refreshToken(refreshTokenDto.refreshToken);
    }
  
    @UseGuards(JwtAuthGuard)
    @Get()
    findAll() {
      return this.usersService.findAll();
    }
  
    @UseGuards(JwtAuthGuard)
    @Get(':id')
    findOne(@Param('id') id: string) {
      return this.usersService.findOne(id);
    }
  
    @UseGuards(JwtAuthGuard)
    @Patch(':id')
    update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
      return this.usersService.update(id, updateUserDto);
    }
  
    @UseGuards(JwtAuthGuard)
    @Delete(':id')
    remove(@Param('id') id: string) {
      return this.usersService.remove(id);
    }
  
    @UseGuards(JwtAuthGuard)
    @Post(':id/change-password')
    changePassword(
      @Param('id') id: string,
      @Body() changePasswordDto: ChangePasswordDto,
    ) {
      return this.usersService.changePassword(id, changePasswordDto);
    }
  }