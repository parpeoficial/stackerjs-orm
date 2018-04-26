import { Config } from "stackerjs-utils";

module.exports = {
    driver: Config.env("db.driver"),
    host: Config.env("db.host"),
    name: Config.env("db.name"),
    user: Config.env("db.user"),
    pass: Config.env("db.pass"),
    log: true
};
