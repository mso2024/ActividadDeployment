import { BadRequestException, ConflictException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User as SchemaUser, UserDocument } from './schema/user.schema';
import { ChangePasswordDto, CreateUserDto, LoginDto, RefreshTokenDto, UpdateUserDto, VerifyEmailDto } from './dto/user.dto';
import { EmailService } from '../email/email.service';
import { User, UserServiceInterface } from './interfaces/user.interface';
import { SmsService } from 'src/sms/sms.service';

@Injectable()
export class UsersService implements UserServiceInterface {
  constructor(
    @InjectModel(SchemaUser.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
    private configService: ConfigService,
    private emailService: EmailService,
    private smsService: SmsService,
  ) {}

  private toUserInterface(userDoc: UserDocument): User {
    const userObj = userDoc.toObject();
    userObj.id = userObj._id.toString();
    delete userObj.password;
    delete userObj.__v;
    return userObj as User;
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    // Check if user already exists
    const existingUser = await this.userModel.findOne({ email: createUserDto.email }).exec();
    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    // Generate verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString(); 
    const verificationCodeExpires = new Date();
    verificationCodeExpires.setMinutes(verificationCodeExpires.getMinutes() + 5); 

    // Create new user
    const newUser = new this.userModel({
      ...createUserDto,
      password: hashedPassword,
      verificationCode,
      verificationCodeExpires,
    });

    const savedUser = await newUser.save();

    // Send verification email
    await this.emailService.sendVerificationEmail(
      savedUser.email,
      savedUser.name,
      verificationCode,
    );

    // Return user without sensitive data
    return this.toUserInterface(savedUser);
  }

  async verifyEmail(verifyEmailDto: VerifyEmailDto): Promise<{ message: string }> {
    const { email, code } = verifyEmailDto;
    const user = await this.userModel.findOne({ email }).exec();
    
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.isVerified) {
      return { message: 'Email already verified' };
    }

    if (user.verificationCode !== code) {
      throw new BadRequestException('Invalid verification code');
    }

    if (user.verificationCodeExpires && new Date() > user.verificationCodeExpires) {
      throw new BadRequestException('Verification code expired');
    }

    // Update user verification status
    user.isVerified = true;
    user.verificationCode = undefined;
    user.verificationCodeExpires = undefined;
    await user.save();

    return { message: 'Email verified successfully' };
  }

  async login(loginDto: LoginDto): Promise<{ message: string }> {
    const user = await this.userModel.findOne({ email: loginDto.email }).exec();
    console.log(loginDto)
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if user is verified
    if (!user.isVerified) {
      console.log("variable1" + user.isVerified);
      throw new UnauthorizedException('Please verify your email before logging in');
    }

    // Compare passwords
    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
    if (!isPasswordValid) {
      console.log("variable2" + isPasswordValid);
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate 6 digit code with 2 minute expiration
    const smsCode = Math.floor(100000 + Math.random() * 900000).toString();
    const smsCodeExpires = new Date();
    smsCodeExpires.setMinutes(smsCodeExpires.getMinutes() + 2);
  
    user.smsCode = smsCode;
    user.smsCodeExpires = smsCodeExpires;
    await user.save();
  
    // Send SMS with Twilio
    await this.smsService.sendSms(
      user.phone,
      `Tu código de verificación es: ${smsCode}`
    );
  
    return { message: 'Código enviado al número registrado.' };
  }  
  
  async verifySmsCode(email: string, code: string): Promise<{ accessToken: string; refreshToken: string }> {
    const user = await this.userModel.findOne({ email }).exec();
  
    if (!user) {
      throw new NotFoundException('User not found');
    }
  
    if (!user.smsCode || user.smsCode !== code) {
      throw new UnauthorizedException('Invalid SMS code');
    }
  
    if (user.smsCodeExpires && new Date() > user.smsCodeExpires) {
      throw new UnauthorizedException('SMS code expired');
    }
  
    user.smsCode = undefined;
    user.smsCodeExpires = undefined;
  
    const tokens = await this.getTokens(user.id, user.email, user.role);
  
    const hashedRefreshToken = await bcrypt.hash(tokens.refreshToken, 10);
    user.refreshToken = hashedRefreshToken;
  
    await user.save();
  
    return tokens;
  }  

  // Implementing the missing methods
  async refreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      // Verify refresh token
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
      });

      // Find user
      const user = await this.userModel.findById(payload.sub).exec();
      if (!user) {
        throw new UnauthorizedException('Invalid token');
      }

      // Validate stored refresh token
      if (!user.refreshToken) {
        throw new UnauthorizedException('Invalid token');
      }
      
      const isRefreshTokenValid = await bcrypt.compare(
        refreshToken,
        user.refreshToken
      );
      
      if (!isRefreshTokenValid) {
        throw new UnauthorizedException('Invalid token');
      }

      // Generate new tokens
      const tokens = await this.getTokens(user.id, user.email, user.role);
      
      // Update refresh token in database
      const hashedRefreshToken = await bcrypt.hash(tokens.refreshToken, 10);
      user.refreshToken = hashedRefreshToken;
      await user.save();

      return tokens;
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }

  // Update all other methods to use the toUserInterface helper
  async findAll(): Promise<User[]> {
    const users = await this.userModel.find().exec();
    return users.map(user => this.toUserInterface(user));
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userModel.findById(id).exec();
    if (!user) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }
    return this.toUserInterface(user);
  }

  async findByEmail(email: string): Promise<User> {
    const user = await this.userModel.findOne({ email }).exec();
    if (!user) {
      throw new NotFoundException(`User with email "${email}" not found`);
    }
    return this.toUserInterface(user);
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.userModel.findById(id).exec();
    if (!user) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }

    // If updating email, check if new email is already taken
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.userModel.findOne({ email: updateUserDto.email }).exec();
      if (existingUser) {
        throw new ConflictException('Email already registered');
      }
    }

    // If updating password, hash it
    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    // Update user
    Object.assign(user, updateUserDto);
    const updatedUser = await user.save();
    return this.toUserInterface(updatedUser);
  }

  async remove(id: string): Promise<void> {
    const result = await this.userModel.deleteOne({ _id: id }).exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }
  }

  async verifyUser(id: string): Promise<User> {
    const user = await this.userModel.findById(id).exec();
    if (!user) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }
    
    user.isVerified = true;
    user.verificationCode = undefined;
    user.verificationCodeExpires = undefined;
    const updatedUser = await user.save();
    return this.toUserInterface(updatedUser);
  }

  async changePassword(id: string, changePasswordDto: ChangePasswordDto): Promise<void> {
    const user = await this.userModel.findById(id).exec();
    if (!user) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(changePasswordDto.currentPassword, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(changePasswordDto.newPassword, 10);
    user.password = hashedPassword;
    await user.save();
  }

  private async getTokens(userId: string, email: string, role: string): Promise<{ accessToken: string; refreshToken: string }> {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        {
          sub: userId,
          email,
          role,
        },
        {
          secret: this.configService.get('JWT_ACCESS_SECRET'),
          expiresIn: this.configService.get('JWT_ACCESS_EXPIRATION'),
        },
      ),
      this.jwtService.signAsync(
        {
          sub: userId,
          email,
          role,
        },
        {
          secret: this.configService.get('JWT_REFRESH_SECRET'),
          expiresIn: this.configService.get('JWT_REFRESH_EXPIRATION'),
        },
      ),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }
}