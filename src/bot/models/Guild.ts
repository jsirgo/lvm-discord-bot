import { Member } from "./Member";

export class Guild {
  id: string;
  members: Member[];
  name: string;
  ownerID: string;
  description: string;
  banner: string;
}