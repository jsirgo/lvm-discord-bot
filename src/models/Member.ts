import { Role } from './Role';

export class Member {
  id: string;
  joinedAt: Date;
  nickname: string;
  roles: Role[];
}