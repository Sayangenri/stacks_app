import { AppConfig, UserSession } from "@stacks/connect";

export const appConfig = new AppConfig(["store_write"]);
export const userSession = new UserSession({ appConfig });
