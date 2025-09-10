import { MySQLStorage, type IStorage } from "./mysql-storage";

export const storage: IStorage = new MySQLStorage();
