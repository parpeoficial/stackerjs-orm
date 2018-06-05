import { DB } from "stackerjs-db";
import { UserSchema } from "../DataProvider/Schemas";


describe.only("Unit/BaseSchemaTest", () => 
{

    before(done => 
    {
        DB.Factory.getQueryBuilder()
            .table()
            .create("user")
            .set({
                id: { type: "pk", required: true },
                first_name: { type: "varchar", size: 100, required: true },
                last_name: { type: "varchar", size: 100, required: true },
                extra: { type: "json" },
                birthday: { type: "date" },
                active: { type: "integer", defaultValue: 0 }
            })
            .execute()
            .then(results => 
            {
                console.log(results);
            })
            .then(done);
    });

    describe("Inserting users", () => 
    {
        it("Should insert an user without trouble", done => 
        {
            UserSchema.save({
                first_name: "Rick",
                last_name: "Ross",
                birthday: new Date("1985-11-14"),
                active: 1
            })
                .then(response => 
                {
                    console.log(response);
                })
                .then(done);
        });
    });

    after(done => 
    {
        DB.Factory.getQueryBuilder()
            .table()
            .drop("user")
            .execute()
            .then(results => console.log(results))
            .then(done);
    });

});