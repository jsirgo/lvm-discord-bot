import { Role } from './Role';

export class Member {
  id: string;
  joinedAt: Date;
  username: string;
  roles: Role[];
}