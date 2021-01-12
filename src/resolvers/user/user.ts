import {
  Arg,
  Ctx,
  FieldResolver,
  Mutation,
  Query,
  Resolver,
  Root,
  UseMiddleware,
} from 'type-graphql';
import argon2 from 'argon2';

import { MyContext } from '../../types';
import { User } from '../../entities/User';
import {
  cookieSession,
  FORGOT_PASSWORD_PREFIX,
  FRONTEND_URL,
} from '../../constants';
import { sendEmail } from '../../utils/sendEmail';
import { v4 } from 'uuid';
import { generateUsername } from '../../utils/generateUsername';
import { emailIsValid, passwordIsValid } from '../../utils/fieldValidators';
import { isAuth } from '../../middleware/auth';
import { UserResponse, FullUserInput, FieldError, UserInput } from './types';

@Resolver(User)
export class UserResolver {
  // This makes email hidden to other users than
  // themselves, remove this resolver to erase this behavior
  @FieldResolver(() => String)
  email(@Root() user: User, @Ctx() { req }: MyContext) {
    return user.id === req.session.userId ? user.email : '';
  }

  // Register or sign up if you will
  @Mutation(() => UserResponse)
  async register(
    @Arg('options') options: FullUserInput,
    @Ctx() { req }: MyContext
  ): Promise<UserResponse> {
    const errors: FieldError[] = [];
    if (!options.email) {
      errors.push({ field: 'email', message: 'Please insert an email' });
    } else if (!emailIsValid(options.email)) {
      errors.push({ field: 'email', message: 'Please insert a valid email' });
    } else if (await User.findOne({ where: { email: options.email } })) {
      errors.push({
        field: 'email',
        message: 'That email already exists',
      });
    }

    if (!options.password) {
      errors.push({ field: 'password', message: 'Please insert a password' });
    } else if (!passwordIsValid(options.email)) {
      return {
        errors: [
          {
            field: 'password',
            // Change this message if you change the password validation function
            message: 'Passwords must be at least 6 characters long',
          },
        ],
      };
    }

    if (errors.length) return { errors };

    const hashedPassword = await argon2.hash(options.password);
    let { username } = options;
    if (!username) {
      username = await generateUsername(options.email);
    }
    const user = await User.create({
      username,
      password: hashedPassword,
      name: options.username || '',
      email: options.email,
    }).save();

    // The line below logs the user in right after
    // signin up, remove it to remove the behavior
    req.session.userId = user.id;

    return { user };
  }

  // Log In resolver
  @Mutation(() => UserResponse)
  async login(
    @Arg('options') options: UserInput,
    @Ctx() { req }: MyContext
  ): Promise<UserResponse> {
    const user = await User.findOne({ where: { email: options.email } });
    if (!user) {
      return {
        errors: [{ field: 'email', message: "That email doesn't exist" }],
      };
    }
    const valid = await argon2.verify(user.password, options.password);
    if (!valid) {
      return {
        errors: [{ field: 'password', message: 'Incorrect password' }],
      };
    }

    // Actually logs the user in
    req.session.userId = user.id;
    return { user };
  }

  // This will send an email to the account if exists
  // with a link to change their passwords, change the
  // path to the path in your frontend with the actual form
  // to change it
  @Mutation(() => Boolean)
  async forgotPassword(
    @Arg('email') email: string,
    @Ctx() { redis }: MyContext
  ) {
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return true;
    }

    const token = v4();

    await redis.set(
      FORGOT_PASSWORD_PREFIX + token,
      user.id,
      'ex',
      // Change this in order to change the time before
      // the token expires, set to 3 days by default
      1000 * 60 * 60 * 24 * 3
    );

    sendEmail(
      email,
      'Forgot your password?',
      `Click Here to <a href="${FRONTEND_URL}/forgot-password?q=${token}">
      Reset password
      </a>`
    );
    return true;
  }

  // Actually changes the password
  @Mutation(() => UserResponse)
  async changePassword(
    @Arg('token') token: string,
    @Arg('newPassword') newPassword: string,
    @Ctx() { redis, req }: MyContext
  ): Promise<UserResponse> {
    const userId = await redis.get(FORGOT_PASSWORD_PREFIX + token);
    if (!userId) {
      return {
        errors: [
          {
            field: 'token',
            message: 'Invalid token',
          },
        ],
      };
    }
    const { isValid, message } = passwordIsValid(newPassword);
    if (!isValid) {
      return {
        errors: [
          {
            field: 'newPassword',
            message,
          },
        ],
      };
    }

    const user = await User.findOne(userId);

    if (!user) {
      return {
        errors: [
          {
            field: 'token',
            message: 'Invalid token',
          },
        ],
      };
    }

    const hashedPassword = await argon2.hash(newPassword);
    User.update({ id: user.id }, { password: hashedPassword });

    // Log the user in after changing it's password
    req.session.userId = user.id;

    return { user };
  }

  // Gets the user info
  @UseMiddleware(isAuth)
  @Query(() => User, { nullable: true })
  async me(@Ctx() { req }: MyContext): Promise<User | undefined> {
    return await User.findOne(req.session.userId);
  }

  // Logs the user out
  @Mutation(() => Boolean)
  logout(@Ctx() { req, res }: MyContext) {
    return new Promise((resolve) =>
      req.session.destroy((err: any) => {
        res.clearCookie(cookieSession);
        if (err) {
          console.log(err);
          resolve(false);
        } else {
          resolve(true);
        }
      })
    );
  }
}
