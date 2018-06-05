import { ORM } from "./../../src";

export const UserSchema = ORM.BaseSchema({
    table: "user",

    fields: [
        {
            name: "id", type: "pk", required: true
        }
    ]
});