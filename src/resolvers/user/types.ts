import { User } from "../../entities/User";
import { InputType, Field, ObjectType } from "type-graphql";

@InputType()
export class UserInput {
  @Field()
  email!: string;
  @Field()
  password!: string;
}

@InputType()
export class FullUserInput extends UserInput {
  @Field(() => String, { nullable: true })
  username?: string;
  @Field(() => String, { nullable: true })
  name?: string;
}

@ObjectType()
export class FieldError {
  @Field()
  field!: string;

  @Field()
  message!: string;
}

@ObjectType()
export class UserResponse {
  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[];

  @Field(() => User, { nullable: true })
  user?: User;
}
