import { User } from '../entities/User';

export const generateUsername = async (email: string): Promise<string> => {
  let hash: string, username: string;
  while (true) {
    hash =
      '_' +
      parseInt((Math.random() * 9).toString()) +
      parseInt((Math.random() * 9).toString()) +
      parseInt((Math.random() * 9).toString()) +
      parseInt((Math.random() * 9).toString());
    username = email.substr(0, email.indexOf('@')) + hash;
    if (!(await User.findOne({ where: { username } }))) {
      break;
    }
  }
  return username;
};
